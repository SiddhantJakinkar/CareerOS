import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  WHISPER_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  JSEARCH_API_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  DEFAULT_JOB_COUNTRY: z.string().default('India'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    console.error(`Environment validation failed: ${missing}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  return parsed.success ? parsed.data : (process.env as unknown as Env);
}

export const env = loadEnv();
