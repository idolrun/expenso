import path from "node:path";
import { defineConfig } from "vitest/config";

const isIntegration = process.env.RUN_DB_INTEGRATION === "1";
const baseExclude = ["node_modules", ".next", "dist", ".kilo"];

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: isIntegration
      ? ["**/*.integration.test.ts"]
      : ["**/*.test.ts"],
    exclude: isIntegration
      ? baseExclude
      : [...baseExclude, "**/*.integration.test.ts"],
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    fileParallelism: !isIntegration,
  },
  resolve: {
    alias: [
      {
        find: /^@\/generated\//,
        replacement: `${path.resolve(__dirname, "src/generated")}/`,
      },
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname)}/`,
      },
    ],
  },
});
