import { z } from 'zod';

export const interpretedSearchSchema = z.object({
  intent: z.enum(['restaurant_search', 'gibberish', 'off_topic']),
  locationSpecified: z.boolean(),
  query: z.string().min(1).default('restaurant'),
  near: z.string().min(1),
  openNow: z.boolean().optional(),
  minPrice: z.number().int().min(1).max(4).optional(),
  maxPrice: z.number().int().min(1).max(4).optional(),
  sort: z.enum(['RELEVANCE', 'DISTANCE']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export type InterpretedSearch = z.infer<typeof interpretedSearchSchema>;
