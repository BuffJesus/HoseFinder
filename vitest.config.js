import { defineConfig } from "vitest/config";

// Vitest config — scoped at the pure-logic layer. Component tests aren't
// wired yet (no jsdom), so we keep `environment: "node"` which keeps the
// suite fast (~400 ms for the full run) and avoids pulling in React types.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.js"],
      exclude: ["src/lib/**/*.test.js"],
    },
  },
});
