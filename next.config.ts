import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The AI instructions in /prompts are read from disk at runtime
  // (src/lib/ai/prompts.ts), so ship them with every server route.
  outputFileTracingIncludes: {
    "/*": ["./prompts/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
