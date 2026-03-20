import { z } from 'zod';

export const interpretedSearchSchema = z.object({
  intent: z.enum(['restaurant_search', 'gibberish', 'off_topic']),
  locationSpecified: z.boolean(),
  query: z.string().min(1),
  near: z.string().min(1),
  openNow: z.boolean().nullable(),
  minPrice: z.number().int().min(1).max(4).nullable(),
  maxPrice: z.number().int().min(1).max(4).nullable(),
  sort: z.enum(['RELEVANCE', 'DISTANCE']).nullable(),
  limit: z.number().int().min(1).max(50).nullable(),
});

export type InterpretedSearch = z.infer<typeof interpretedSearchSchema>;
