import { resolve } from 'node:path';
import { z } from 'zod';

export const envSchema = z.object({
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
});

export type DatabaseEnv = z.infer<typeof envSchema>;

// Same depth from src/ and dist/, so the repo root .env is found in both.
export const envFilePath = resolve(import.meta.dirname, '../../../../.env');

export function validateEnv(raw: Record<string, unknown>): DatabaseEnv {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid database environment variables. ${problems}`);
  }
  return result.data;
}
