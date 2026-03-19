import OpenAI from 'openai';
import { env } from '../config/env.js';
import { interpretedSearchSchema } from '../schemas/interpretedSearchSchema.js';
import { HttpError } from '../utils/httpError.js';
import type { InterpretedSearch } from '../types/search.js';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

const MAX_RETRIES = 2;

const SYSTEM_PROMPT = `You are a restaurant search query interpreter. Given a user's natural language request, extract structured search parameters.

Return ONLY valid JSON with these fields:
- "intent": one of "restaurant_search", "gibberish", "off_topic"
  - "gibberish" if the message is nonsensical, random characters, or has no discernible meaning
  - "off_topic" if the message is a real sentence but unrelated to finding restaurants or food
  - "restaurant_search" for valid restaurant/food search queries
- "query": string — the cuisine, food type, or restaurant name to search for (e.g., "sushi", "pizza", "Italian")
- "near": string — the location/area mentioned (e.g., "downtown Los Angeles", "Manhattan, NYC")
- "openNow": boolean — true if the user wants places open now, otherwise omit
- "minPrice": number (1-4) — minimum price level if a price preference is mentioned (1=cheapest, 4=most expensive). For "cheap", use minPrice=1, maxPrice=2. For "expensive", use minPrice=3, maxPrice=4.
- "maxPrice": number (1-4) — maximum price level
- "sort": one of "RELEVANCE", "RATING", "DISTANCE", "POPULARITY" — if the user mentions "best", "top rated", or "highly rated", use "RATING". If "nearby" or "closest", use "DISTANCE". If "popular" or "trending", use "POPULARITY". Otherwise omit.
- "limit": number (1-50) — only if the user specifies a number of results

Rules:
- Always include "intent", "query", and "near".
- If intent is "gibberish" or "off_topic", use default values for query ("restaurant") and near ("New York").
- If no cuisine is mentioned, use "restaurant" for query.
- If no location is mentioned, use "New York" as default for near.
- Only include optional fields if clearly implied by the user's message.
- Return ONLY the JSON object, no explanation or markdown.`;

export async function interpretMessage(
  message: string,
  client?: OpenAI,
): Promise<InterpretedSearch> {
  const openai = client ?? getOpenAIClient();
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ];

      if (lastError) {
        messages.push({
          role: 'user',
          content: `Your previous response was invalid: ${lastError}. Return strictly valid JSON matching the required schema.`,
        });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      const parsed: unknown = JSON.parse(content);

      const result = interpretedSearchSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(result.error.issues.map((i) => i.message).join(', '));
      }

      if (result.data.intent === 'gibberish') {
        throw new HttpError(
          422,
          'That doesn\'t look like a valid request. Try something like "sushi near downtown LA".',
        );
      }

      if (result.data.intent === 'off_topic') {
        throw new HttpError(
          422,
          'I can only help with restaurant searches. Try "cheap Italian food in Manhattan".',
        );
      }

      return result.data;
    } catch (err) {
      if (err instanceof HttpError) throw err;
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new HttpError(
    503,
    'Could not understand your request after multiple attempts. Please try rephrasing.',
  );
}
