import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://jobboard:jobboard@localhost:5444/jobboard',
      JWT_SECRET: 'test-secret',
      WEB_ORIGIN: 'http://localhost:5173',
      COOKIE_SECURE: 'false',
      REDIS_URL: 'redis://localhost:6379',
    },
  },
});