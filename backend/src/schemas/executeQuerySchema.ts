import { z } from 'zod';

export const executeQuerySchema = z.object({
  message: z
    .string()
    .min(3, 'Message must be at least 3 characters')
    .max(500, 'Message must be at most 500 characters'),
  code: z
    .string(),
});
