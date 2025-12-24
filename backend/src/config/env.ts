import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

/**
 * Environment variable schema with strict validation
 * All required variables must be present and valid
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server Configuration
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('4000'),

  // Database
  DATABASE_URL: z.string().url().min(1, 'Database URL is required'),

  // Redis
  REDIS_URL: z.string().url().min(1, 'Redis URL is required'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Frontend
  FRONTEND_URL: z.string().url().min(1, 'Frontend URL is required'),

  // Email Configuration (Optional for MVP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // File Upload (Future)
  UPLOAD_MAX_SIZE: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  ALLOWED_FILE_TYPES: z.string().optional(),

  // Observability
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Sentry (Optional)
  SENTRY_DSN: z.string().url().optional(),
});

/**
 * Parsed and validated environment variables
 * Type-safe access to all environment configuration
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

/**
 * Validated environment configuration
 * Import this to access environment variables throughout the application
 */
export const env = validateEnv();

/**
 * Type-safe helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Type-safe helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Type-safe helper to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';
