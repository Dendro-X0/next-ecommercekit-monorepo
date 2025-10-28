import * as path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["test/setup.ts"],
    include: ["test/**/*.test.ts"],
    isolate: true,
  },
  resolve: {
    alias: {
      "@repo/db": path.resolve(__dirname, "../db/src/index.ts"),
    },
  },
})
