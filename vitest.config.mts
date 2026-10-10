import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests for everything code decides (ROADMAP A1). Run: npm test
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" throws outside Next.js server code; tests are server code.
      "server-only": path.resolve(import.meta.dirname, "src/test/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
