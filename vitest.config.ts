import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./lib/tests/setup.ts"],
    testTimeout: 30000, // 30 seconds for load tests
    hookTimeout: 30000, // 30 seconds for setup/teardown
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "lib/tests/",
        "**/*.config.*",
        "**/.*",
        "dist/",
        ".next/",
      ],
    },
    // Run tests in sequence for load tests to avoid resource conflicts
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/app": path.resolve(__dirname, "./app"),
    },
  },
});
