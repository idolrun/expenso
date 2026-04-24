import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,integration.test}.ts"],
    exclude: ["node_modules", ".next", "dist", ".kilo"],
    setupFiles: ["./tests/setup/vitest.setup.ts"],
  },
  resolve: {
    alias: [
      {
        find: /^@\/app\/generated\//,
        replacement: `${path.resolve(__dirname, "src/app/generated")}/`,
      },
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname)}/`,
      },
    ],
  },
});
