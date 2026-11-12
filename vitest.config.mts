import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integratsiya testlari alohida test bazasida ishlaydi (TEST_DATABASE_URL).
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://jumis:jumis@localhost:5432/jumis_test?schema=public";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Next.js tashqarisida "server-only" import xato bermasligi uchun.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/empty.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: "test",
      APP_URL: "http://localhost:3000",
      AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
      SMTP_FROM: "Jumis AI <test@jumis.local>",
    },
  },
});
