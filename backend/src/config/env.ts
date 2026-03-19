import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  FOURSQUARE_API_KEY: z.string().min(1, 'FOURSQUARE_API_KEY is required'),
  FRONTEND_ORIGINS: z.string().min(1).default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);