import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  GEMINI_API_KEY: z.string({
    required_error: 'GEMINI_API_KEY is required in environment variables',
  }).min(1, 'GEMINI_API_KEY cannot be empty'),
  SUPABASE_URL: z.string({
    required_error: 'SUPABASE_URL is required in environment variables',
  }).url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string({
    required_error: 'SUPABASE_ANON_KEY is required in environment variables',
  }).min(1, 'SUPABASE_ANON_KEY cannot be empty'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Environment validation failed:');
  result.error.errors.forEach((err) => {
    console.error(`   - ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

export const config = result.data;
