import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function validateConfig(): void {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Configuration validation failed:');
    result.error.issues.forEach((issue) => {
      const path = issue.path.length > 0 ? issue.path.map(String).join('.') : 'root';
      console.error(`  - ${path}: ${issue.message}`);
    });
    process.exit(1);
  }
  console.log('Configuration validated successfully');
}
