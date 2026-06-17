import { defineConfig } from "tsup";

// Single library entry point — consumers `import { … } from "@kleroterion/koine"`.
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  target: "node20",
  platform: "node",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
});
