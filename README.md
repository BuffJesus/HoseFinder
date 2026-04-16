# HoseFinder

[![CI](https://github.com/BuffJesus/HoseFinder/actions/workflows/ci.yml/badge.svg)](https://github.com/BuffJesus/HoseFinder/actions/workflows/ci.yml)
[![Deploy](https://github.com/BuffJesus/HoseFinder/actions/workflows/deploy.yml/badge.svg)](https://buffjesus.github.io/HoseFinder/)

A premium build tool for Gates molded coolant hoses — 4,723 parts, instant
visual search, filter by size / shape / role, plan complete cooling systems,
and share parts lists via URL.

**Live site:** <https://buffjesus.github.io/HoseFinder/>

## Run locally

1. Install Node.js 20+.
2. `npm install`
3. `npm run dev`
4. Open the local URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                               |
| `npm run build`        | Production build → `dist/`                              |
| `npm run preview`      | Serve the production build locally                      |
| `npm test`             | Run the pure-logic test suite (vitest)                  |
| `npm run test:watch`   | Re-run tests on file change                             |
| `npm run test:coverage`| Run tests with v8 coverage report                       |
| `npm run typecheck`    | Type-check `src/lib/**` via JSDoc + tsc (no emit)       |

## Project layout

```
CoolantHoseFinder.jsx    # UI composition layer — imports pure helpers from src/lib
src/
  lib/                   # Pure business logic: units, scoring, similarity, roles,
                         #   share URL codec, natural-size parser, edit distance.
                         #   Every helper is JSDoc-typed and unit-tested.
  i18n/                  # Translation catalogues (en, es) — dotted-key JSON
  components/ui/         # Local shadcn-derived primitives (Button, Dialog, ...)
  main.jsx               # App entry — mounts <CoolantHoseFinder />, registers SW
  styles.css             # Global styles + mobile tap-target rule + a11y focus ring
data/
  hoses.json             # 4,723 enriched parts (derived from Gates PDF)
  rows.json              # Shape-row summaries
  catalog-meta.json      # PDF provenance + extraction timestamp
images/
  catalog/               # Full catalog page renders
  hoses/                 # Per-part silhouette crops
public/
  manifest.webmanifest   # PWA manifest
  sw.js                  # Service worker (SWR for shell/data, cache-first for images)
  icon.svg               # Installable icon
scripts/
  extract_catalog_assets.py  # PDF → hoses.json + rows.json + catalog-meta.json
```

## Run in JetBrains Rider / WebStorm

- `HoseFinder` — launches both the Vite dev server and a browser debug
  session together.
- `HoseFinder Dev Server` — Vite server only.
- `HoseFinder Browser` — attaches the browser debugger to an already-running
  dev server.

## Testing

Pure logic in `src/lib/**` is covered by vitest. Run `npm test` once or
`npm run test:watch` during development. Coverage: `npm run test:coverage`.

Component-level testing (React Testing Library) is not yet set up — the
scaffolding is in place but no component tests have been written.

## Roadmap

- [`ROADMAP.md`](./ROADMAP.md) — v1, shipped (entry experience, visual
  search, power features, polish).
- [`ROADMAP-v2.md`](./ROADMAP-v2.md) — current track (projects, smarter
  matching, device measurement, trust, dev quality).

## Deployment

Hosted on GitHub Pages at <https://buffjesus.github.io/HoseFinder/>. Every
push to `main` runs `.github/workflows/deploy.yml`:

1. `npm ci && npm test && npm run build` — builds with `base: "/HoseFinder/"`
2. Copies `data/` and `images/` into `dist/` (Vite's `public/` dir is reserved
   for tiny shell assets — the 77 MB image corpus lives at the repo root).
3. Uploads `dist/` as a Pages artifact and `actions/deploy-pages@v4` publishes.

**One-time repo setup** (already done, noted for future forks): Settings →
Pages → Source: "GitHub Actions". No custom domain needed unless desired.

For root-hosted deployments (Vercel, Netlify, custom domain), override:
```bash
VITE_BASE=/ npm run build
```

## Notes

- Tailwind utility classes are loaded at runtime via the CDN script in
  [`index.html`](./index.html) — no Tailwind build step.
- If `data/hoses.json` is missing the component falls back to built-in
  sample data so the app still boots.
- The service worker only registers in production (`import.meta.env.PROD`),
  so it never interferes with dev-server HMR.
