import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET_KEY: z.string(),
  RESEND_API_KEY: z.string(),
  FRONTEND_URL: z.string(),
  MAGIC_EMAIL_FROM: z.string(),
  REDIS_URL: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: z.string(),
  NODE_ENV: z.string().default('development'),
});

export type Env = z.infer<typeof envSchema>;
