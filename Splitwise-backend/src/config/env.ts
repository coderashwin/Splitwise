import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_VERSION: z.string().default('v1'),
  MONGODB_URI: z.string().url(),
  MONGODB_DB_NAME: z.string(),
  REDIS_URL: z.string(),
  JWT_PRIVATE_KEY_BASE64: z.string(),
  JWT_PUBLIC_KEY_BASE64: z.string(),
  JWT_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(2592000),
  JWT_ISSUER: z.string().default('splitpro-api'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY_BASE64: z.string().optional(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  CLOUDFRONT_URL: z.string().url(),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_GLOBAL: z.coerce.number().default(500),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().default(10),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10485760),
  UPLOAD_PRESIGN_TTL_SECONDS: z.coerce.number().default(300),
});

// This will throw at startup if any required env var is missing — intended behaviour
export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
