import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is the path prefix the built site is served from. GitHub Pages
// serves project sites at `/<repo>/`, so production builds need that prefix
// baked in. Dev stays at `/` so the local server doesn't need the prefix.
// Override either via `VITE_BASE=/ npm run build` (for root-hosted deploys
// like Vercel/Netlify/custom domains).
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === "build" ? "/HoseFinder/" : "/"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
