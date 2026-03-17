import OpenAI from 'openai';
import { env } from '../config/env.js';
import { interpretedSearchSchema } from '../schemas/interpretedSearchSchema.js';
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

const SYSTEM_PROMPT = `You are a restaurant search query interpreter. Given a user's natural language request, extract structured search parameters.

Return ONLY valid JSON with these fields:
- "query": string — the cuisine, food type, or restaurant name to search for (e.g., "sushi", "pizza", "Italian")
- "near": string — the location/area mentioned (e.g., "downtown Los Angeles", "Manhattan, NYC")
- "openNow": boolean — true if the user wants places open now, otherwise omit
- "minPrice": number (1-4) — minimum price level if a price preference is mentioned (1=cheapest, 4=most expensive). For "cheap", use minPrice=1, maxPrice=2. For "expensive", use minPrice=3, maxPrice=4.
- "maxPrice": number (1-4) — maximum price level
- "sort": one of "RELEVANCE", "RATING", "DISTANCE", "POPULARITY" — if the user mentions "best", "top rated", or "highly rated", use "RATING". If "nearby" or "closest", use "DISTANCE". If "popular" or "trending", use "POPULARITY". Otherwise omit.
- "limit": number (1-50) — only if the user specifies a number of results

Rules:
- Always extract "query" and "near". If no cuisine is mentioned, use "restaurant".
- If no location is mentioned, use "New York" as default.
- Only include optional fields if clearly implied by the user's message.
- Return ONLY the JSON object, no explanation or markdown.`;

export async function interpretMessage(message: string): Promise<InterpretedSearch> {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ],
    temperature: 0,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to interpret message: no response from AI');
  }

  const parsed = JSON.parse(content);
  const validated = interpretedSearchSchema.parse(parsed);

  return validated;
}
