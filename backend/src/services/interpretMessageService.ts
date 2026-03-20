import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { env } from '../config/env.js';
import { interpretedSearchSchema } from '../schemas/interpretedSearchSchema.js';
import { HttpError } from '../utils/httpError.js';
import type { InterpretedSearch } from '../types/search.js';

const RESPONSE_FORMAT = zodResponseFormat(interpretedSearchSchema, 'search');
const MAX_TRANSIENT_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 100;

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

Extract these fields:
- "intent": one of "restaurant_search", "gibberish", "off_topic"
  - "gibberish" if the message is nonsensical, random characters, or has no discernible meaning
  - "off_topic" if the message is a real sentence but unrelated to finding restaurants or food
  - "restaurant_search" for valid restaurant/food search queries
- "locationSpecified": boolean — true if the user explicitly mentioned a location, city, neighbourhood, or area. false if no location was mentioned.
- "query": string — the cuisine, food type, or restaurant name to search for (e.g., "sushi", "pizza", "Italian")
- "near": string — the location/area mentioned (e.g., "downtown Los Angeles", "Manhattan, NYC")
- "openNow": boolean | null — true if the user wants places open now, otherwise null
- "minPrice": number (1-4) — minimum price level if a price preference is mentioned (1=cheapest, 4=most expensive). For "cheap", use minPrice=1, maxPrice=2. For "expensive", use minPrice=3, maxPrice=4.
- "maxPrice": number (1-4) | null — maximum price level
- "sort": one of "RELEVANCE", "DISTANCE" | null — use "DISTANCE" only when the user explicitly asks for proximity-based ranking (e.g. "nearby", "nearest", "closest", "near me", "walking distance", "closest to me", "around here"). Do not use "DISTANCE" when the user is only specifying a search area such as "in Manila", "near Brooklyn", or "downtown Los Angeles".
- "limit": number (1-50) | null — only if the user specifies a number of results, otherwise null

Rules:
- Always include "intent", "locationSpecified", "query", and "near".
- If intent is "gibberish" or "off_topic", set locationSpecified to false, use default values for query ("restaurant") and near ("New York").
- If no cuisine is mentioned, use "restaurant" for query.
- If no location is mentioned, set locationSpecified to false and use "New York" as the value for near.
- For openNow, minPrice, maxPrice, sort, and limit, use null when the user's message does not clearly imply a value.`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number): number {
  return BASE_RETRY_DELAY_MS * 2 ** attempt;
}

function shouldRetryOpenAIError(error: unknown): boolean {
  return error instanceof OpenAI.APIConnectionError
    || error instanceof OpenAI.APIConnectionTimeoutError
    || error instanceof OpenAI.RateLimitError
    || error instanceof OpenAI.InternalServerError
    || error instanceof OpenAI.ConflictError;
}

async function parseMessageWithRetry(
  openai: OpenAI,
  message: string,
): Promise<InterpretedSearch> {
  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0,
        max_tokens: 200,
        response_format: RESPONSE_FORMAT,
      });

      const result = completion.choices[0]?.message?.parsed;
      if (!result) {
        throw new HttpError(
          503,
          'Empty response from AI. Please try again.',
          'SERVICE_ERROR',
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      const isLastAttempt = attempt === MAX_TRANSIENT_RETRIES;
      if (isLastAttempt || !shouldRetryOpenAIError(error)) {
        break;
      }

      await sleep(getRetryDelayMs(attempt));
    }
  }

  throw new HttpError(
    503,
    'Could not understand your request. Please try rephrasing.',
    'SERVICE_ERROR',
  );
}

export async function interpretMessage(
  message: string,
  client?: OpenAI,
): Promise<InterpretedSearch> {
  const openai = client ?? getOpenAIClient();
  const result = await parseMessageWithRetry(openai, message);

  if (result.intent === 'gibberish') {
    throw new HttpError(
      422,
      'That doesn\'t look like a valid request. Try something like "sushi near downtown LA".',
      'GIBBERISH',
    );
  }

  if (result.intent === 'off_topic') {
    throw new HttpError(
      422,
      'I can only help with restaurant searches. Try "cheap Italian food in Manhattan".',
      'OFF_TOPIC',
    );
  }

  if (!result.locationSpecified) {
    throw new HttpError(
      422,
      'Please include a location in your search, e.g. "sushi in downtown LA" or "pizza near Times Square".',
      'MISSING_LOCATION',
    );
  }

  return result;
}
