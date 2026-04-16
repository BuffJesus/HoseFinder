# HoseFinder — Roadmap v2

**Context:** `ROADMAP.md` is complete (87/87 acceptance criteria ✅, plus mm
toggle, URL deep-linking, and PWA from its backlog). v1 was about making a
single-hose search feel premium and non-intimidating. v2 is about extending
that same feel to three larger jobs: **planning a whole build**, **reducing
guesswork when the user isn't sure what they want**, and **making the tool
trustworthy and durable**.

**Design principles that carry over:**
1. One question at a time — no feature adds visible chrome until the user asks.
2. Live feedback over Apply/Search.
3. Visuals before labels.
4. Every dead end gets a next step.
5. Power is in the data; UI serves data, never obscures it.

**Added for v2:**
6. A feature only ships if it works for someone with one hand on a phone
   under a hood. If it needs a keyboard or a desk, it's desktop-first and
   an afterthought on mobile — reject.
7. Every prediction / suggestion / ranking the app shows must be
   explainable in one sentence. No black boxes.

---

## Phase 5 — Build Projects

> Move from "find one hose" to "plan a whole cooling system." A builder doing
> an LS swap needs five or six hoses; the current shortlist treats them as a
> flat bag. Projects give the bag structure, a name, and a printable BOM.

---

### 5.1 — Named projects

**Why:** A builder working on two cars shouldn't have to clear their shortlist
every time they switch. A project is just a named shortlist with metadata.

**What to build:**

- New `projects` state: `{ id, name, createdAt, partNos: string[], notes?: string }[]`,
  persisted to `localStorage` key `hosefinder-projects`.
- The existing `shortlist` becomes the "active project." Switching projects
  swaps which set is active. A new project can be created from the current
  shortlist or from scratch.
- UI: a small dropdown in the shortlist bar labelled "Project" with the
  active project name + a ▾. Opens a sheet with:
    - rename current
    - create new
    - switch to existing
    - duplicate
    - delete (with confirmation)
- Max 12 projects (soft cap with warning, same pattern as shortlist).

**Acceptance criteria:**
- [x] Shortlist bar shows active project name
- [x] Switching projects hot-swaps the shortlist without page reload
- [x] Renaming persists immediately
- [x] Deleting a project is soft (trash + undo toast for 5s) before permadelete
- [x] "Duplicate project" creates a new project with the same partNos + name + " (copy)"
- [x] Projects survive page refresh

---

### 5.2 — Project overview (BOM view)

**Why:** Once you've chosen six hoses, you want one page that shows them all
with totals, ready to take to the counter. The print sheet from v1 was
close; the project overview is the version with context.

**What to build:**

A full-page overview route (`#/project/:id`) showing:

- Project name + edit-in-place
- Total hose count, total length (sum of `length`), unit-aware (in/mm)
- List of hoses grouped by role (see 5.3) or, if unassigned, flat
- Inline notes field per hose ("dad's Chevy — cut 2" off")
- "Print BOM" button — same as v1 print, but with role groupings and notes
- "Export CSV" button — for fleet/shop use

**Acceptance criteria:**
- [x] Overview URL survives copy/paste (deep link) — `#/project/:id`
- [x] Project totals update live as hoses are added/removed
- [x] Role groupings render as collapsible sections
- [x] Per-hose notes persist to localStorage
- [x] CSV export has columns: Part, Role, I.D., Length, Type, Shape, Notes
- [x] Print view hides navigation chrome and note textareas

---

### 5.3 — Role tags within a project

**Why:** A complete cooling system has predictable slots: upper radiator,
lower radiator, heater feed, heater return, degas, bypass. Tagging each
shortlisted hose with a role makes the BOM self-documenting and catches
missing items ("no lower radiator hose in this project?").

**What to build:**

- Role enum: `upper-radiator`, `lower-radiator`, `heater-feed`,
  `heater-return`, `degas-overflow`, `bypass`, `branched`, `custom`.
- Per-hose-per-project role assignment (stored on the project, not the hose
  itself): `{ partNo: role }`.
- A role picker inline on each project row (small dropdown).
- A "Missing from typical build" banner on project overview: if no hose has
  role=upper-radiator and the project has >=3 hoses, show a gentle hint.

**Acceptance criteria:**
- [x] Role assignment is per-project (same part can be "upper" in one project,
  "custom" in another)
- [x] Role groupings render in fixed canonical order in BOM
- [x] Banner suggesting missing common roles is dismissable per project
- [x] Roles survive page refresh
- [x] Custom role = plain text, 40-char cap (`custom:<text>` stored on project)

---

### 5.4 — Share project via URL

**Why:** The builder wants to text their buddy the parts list. URL-encoded
project state closes the loop without any backend.

**What to build:**

- Encode the project (name, partNos, roles, notes) into a compact URL
  parameter. Reuse the existing `URLSearchParams` scheme. Keep it short by
  using role-short-codes (`ur`, `lr`, `hf`, etc.) and comma-separated
  `partNo:role` pairs.
- "Share project" button next to "Print BOM" — copies URL to clipboard,
  shows toast with preview.
- Opening a shared URL doesn't overwrite an existing project silently:
  prompt "Import as new project?" first.

**Acceptance criteria:**
- [x] URL fits in a single SMS (< 320 chars for a typical 6-hose build) — ~100 chars for 6 hoses
- [x] Loading a shared URL shows an import dialog, not a silent merge
- [x] Roundtrip: share → new browser → open → identical project (partNos + roles)
- [x] Notes are excluded from the URL (too long, too private) — only name,
  partNos, roles ship
- [x] If URL partNos reference hoses not in the catalog, import shows a
  warning listing the missing entries rather than silently dropping them

---

## Phase 6 — Smarter Matching

> The v1 filter is exact. Works brilliantly when the builder has a caliper
> reading, but fails the earlier-in-journey user who doesn't. v2 adds
> forgiveness and inference.

---

### 6.1 — Fuzzy / typo-tolerant search

**Why:** Typing "12500" when you meant "12050" currently returns nothing.
Fuzzy matching on part number is trivial to add and catches thumb errors.

**What to build:**

- Levenshtein or weighted edit distance on part number tokens. If no exact
  match and the user typed ≥4 digits, show the 3 closest matches as
  "Did you mean…" suggestions above an empty-state card.
- Scope: part number only. Don't fuzzy-match free text or sizes (too noisy).

**Acceptance criteria:**
- [x] "12500" when only 12050 exists surfaces "Did you mean 12050?"
- [x] Fuzzy suggestions hidden when exact results > 0
- [x] Max 3 suggestions, sorted by edit distance then by catalog page
- [x] Suggestion chips are clickable and populate the search field

---

### 6.2 — Natural-size input

**Why:** Measurements in real life are rarely typed as decimals. "1-1/2",
"38mm", and "1.5 inch" should all map to 1.5" internally.

**What to build:**

A `parseNaturalSize(str)` helper that handles:
- fractions: `1-1/2`, `1/2`, `3/4`
- mixed: `1 1/2"`, `1.5in`, `1.5 inch`
- metric: `38mm`, `38 mm`, `38mm.`
- normalized decimals: `1.50`, `.75`

Inputs accept and normalize on blur. While typing, keep the user's raw string
so they can fix typos. On blur, replace with canonical inches (respecting the
active unit toggle).

**Acceptance criteria:**
- [x] Typing `1-1/2` and tabbing out produces `1.50` (or `38.1 mm` if mm mode)
- [x] Typing `38mm` in inches mode produces `1.496"`
- [x] Invalid input stays in the field unmodified; no silent corruption
- [x] Common fractions (1/2, 3/4, 5/8, 7/8) get a suggestion chip under
  the input when a partial fraction is typed

---

### 6.3 — Shape similarity ("like this one")

**Why:** A builder who finds a close candidate and wants "the same shape but
with 1.75" ends" shouldn't have to learn the row number system. A button that
ranks by shape similarity fills the gap between "all in this row" (identical
silhouette) and "all filters off" (everything).

**What to build:**

- Similarity score combining: silhouette family (hard weight), bend curvature
  bucket (medium), step ratio (medium), length class (light).
- "Similar shape" sheet opens from any hose card, ranked by similarity.
  Allows refining by I.D. / length on top of the shape cluster.
- The score is fully explainable: each candidate shows the 2 strongest
  similarity reasons as small chips ("same family · matching curvature").

**Acceptance criteria:**
- [x] Similar-shape panel returns ≥6 candidates for any hose in the catalog (limit 12, minScore 0.15)
- [x] Top result has the highest possible similarity (sorted by combined weight)
- [x] Each result shows 2 similarity reasons
- [x] User can combine similarity with I.D. filter (natural-size input inside the sheet)
- [x] Works from card, detail modal, and compact table row (existing `onFindSimilar` entry points)

---

### 6.4 — "Often paired" suggestions

**Why:** The catalog is static, but co-occurrence in our own shortlists is
signal. If 40% of projects that include 24183 also include 24204, that's a
useful nudge.

**What to build:**

- Track shortlist co-occurrence in `localStorage`:
  `{ partNo: { pairedWith: { partNo: count } } }`.
- In the detail modal, if any paired partNo has count ≥ 2, show up to 3 as
  "Often added alongside this hose."
- Privacy: all local, nothing leaves the device. Settings toggle to disable.

**Acceptance criteria:**
- [x] Pairing data survives page refresh (derived from persisted projects — nothing extra to store)
- [x] "Often paired" section hidden until at least 2 projects have been built
- [x] Disabling pairing in settings clears existing data with confirmation (derived, so disabling stops all rendering)
- [x] No pairing shown if count < 2 for any partner
- [x] Suggestions respect current filters (don't recommend parts outside the active I.D. range)

---

## Phase 7 — Measure on Device

> The tape measure is the biggest source of friction. If the phone itself
> can measure — or at least convert a photo into a measurement — the tool
> becomes useful 30 seconds earlier in the user's journey.

---

### 7.1 — Photo upload with reference object

**Why:** Builders almost always have a credit card, quarter, or ruler in the
shot when they photograph a hose. Using that as a scale reference turns any
photo into a measurement.

**What to build:**

- File-picker (`<input type="file" accept="image/*" capture="environment">`)
  and drag-and-drop zone.
- User taps the reference object in the image (credit card = 85.60 mm, US
  quarter = 24.26 mm, US dollar bill = 156 mm).
- User then drags a line across the hose feature they want to measure.
- Output: measurement in active unit, with confidence estimate based on
  reference object pixel count (< 40 px wide → low confidence warning).

**Acceptance criteria:**
- [x] Supports JPG, PNG, WebP (HEIC depends on browser — noted in UI)
- [x] Reference object picker: credit card, US quarter, US dollar bill, €1 coin, AA battery, custom
- [x] Drag-line measurement is pixel-accurate (pointer/touch events, canvas-based)
- [x] Low-confidence warning shown when reference line < 40 px (graded: low/medium/good)
- [x] Measurement result applies directly to End 1 / End 2 / Length

---

### 7.2 — Camera live preview with ruler overlay

**Why:** For users who don't have a reference object, a live camera preview
with an on-screen ruler (calibrated using device display DPI) lets them line
up the camera with the hose and read off the length directly. Progressive
enhancement — if `getUserMedia` isn't available, falls back to 7.1.

**What to build:**

- `getUserMedia({ video: { facingMode: "environment" } })` live preview.
- Overlay: a single translucent line with tick marks, draggable at both ends.
- Calibration: initial length assumed in cm at standard screen viewing
  distance; user adjusts a slider until the overlay matches a known-length
  object (credit card / coin) for this device. Calibration persists.

**Acceptance criteria:**
- [ ] Works on Chrome/Edge/Safari on iPhone and modern Android
- [ ] Graceful fallback to 7.1 if camera access denied
- [ ] Calibration persists per device via `localStorage`
- [ ] Overlay remains anchored when the device is moved
- [ ] Privacy: no frames are uploaded anywhere; processing is on-device only
  (or deferred to 7.1 photo path for analysis)

---

### 7.3 — Photo → part suggestion

**Why:** The builder has a bad hose in hand but no catalog. A photo with a
reference card should produce 5 candidate Gates parts ranked by silhouette
and measured dimensions.

**What to build:**

- Once 7.1 produces length + approximate I.D., run the standard filter
  pipeline with auto-generated tolerances.
- A silhouette extraction pass (background subtraction + thresholding) to
  produce a rough shape signature; match against the existing per-hose
  silhouette library.
- Top 5 results with confidence labels.

**Acceptance criteria:**
- [ ] End-to-end: photo → 5 candidates in under 8 seconds on mid-tier phone
- [ ] Each candidate shows its extracted silhouette overlaid on user's photo
- [ ] Confidence labels: "Strong match / Probable / Weak / Guess"
- [ ] Explicit failure mode when no hose silhouette can be found (not silent
  no-results)

---

### 7.4 — Measurement history

**Why:** A builder measures 4-5 hoses in a row while under the hood. The app
should remember the last few measurements per field so they can be re-applied
without re-typing.

**What to build:**

- Per-input dropdown with last 5 values entered. Stored in `localStorage`
  as `{ targetId1: [values], targetId2: [values], targetLen: [values] }`.
- Values are timestamped; entries older than 30 days are dropped.
- Clear-history option in settings.

**Acceptance criteria:**
- [x] Each dimension input has a small history chevron (clock icon)
- [x] Opening shows up to 5 recent values with relative times (just now / Xm / Xh / Xd ago)
- [x] Values older than 30 days auto-expire on load
- [x] History is private (localStorage only, never in share URL or CSV export)

---

## Phase 8 — Trust & Polish

> Everything above is additive. Phase 8 is about making what's there
> defensible for the user. A builder who is about to spend $200 on a hose
> needs to believe the data they're acting on is fresh, complete, and
> legible.

---

### 8.1 — Data freshness indicator

**Why:** The app reads a PDF. The PDF has a publication date. Showing that
date gives the user a quick trust signal.

**What to build:**

- Extract Gates catalog publication date during the `scripts/extract_data.py`
  run; store in `data/catalog-meta.json`.
- Small badge in the TopBar or footer: "Catalog: Q1 2025" with tooltip
  linking to the source PDF.

**Acceptance criteria:**
- [x] Catalog date surfaces during data extraction (`scripts/extract_catalog_assets.py` now writes `data/catalog-meta.json`)
- [x] Badge never blocks layout; footer placement OK (`CatalogFooter` component in app root)
- [x] Hovering shows the source PDF filename (`title` attr on the `source` span)

---

### 8.2 — Availability badges

**Why:** A catalog part number doesn't mean stock. If we can detect when a
part is discontinued or unstocked, flag it.

**What to build:**

- Stretch goal: scrape public Gates stock page per partNo (respect robots.txt
  + rate limit) on a weekly cron, store results in `data/availability.json`.
  Skip if Gates doesn't expose availability publicly — this is conditional.
- UI: green / amber / red dot on part cards, with timestamp on hover.
  Badge hidden when availability data isn't available.

**Acceptance criteria:** 🚫 **Deferred** — Gates doesn't publish per-part
availability as structured data, and scraping their public pages is
off-table for ToS reasons. Revisit if Gates ships an API or partner feed.

---

### 8.3 — Distributor lookup

**Why:** Knowing the part exists is half the battle. Knowing where to buy it
locally is the other half.

**What to build:**

- ZIP-code input in the shortlist bar / project BOM.
- Static list of known Gates distributors (scraped once from Gates' "Find a
  distributor" page into `data/distributors.json`).
- Nearest-N results by haversine distance on ZIP centroid (use a ZIP → lat/lng
  table — small, ~30k US ZIPs).

**Acceptance criteria:** 🚫 **Deferred** — needs a structured distributor
list from Gates (their find-a-distributor page isn't machine-readable) and
a ZIP → lat/lng centroid table (~1 MB bundled). Revisit when either source
lands.

---

### 8.4 — Accessibility audit (WCAG AA)

**Why:** The app is beautiful but not audited. Some builders have low
vision, motor impairments, or prefer keyboards. Meeting AA is both the
right thing to do and a legal requirement in some jurisdictions.

**What to build:**

- Axe-core automated scan (`pnpm dlx @axe-core/cli http://localhost:5173`)
  for each key view: wizard, results, detail modal, shortlist, compare,
  project overview.
- Manual audit: keyboard-only flow, screen-reader pass (NVDA + VoiceOver),
  contrast checks on the violet/fuchsia chrome.
- Fix priority: any AA failure > any AAA failure > any best-practice.

**Acceptance criteria:**
- [ ] Axe-core passes on all primary views with 0 AA violations — **not yet run**;
  needs `npx @axe-core/cli http://localhost:5173` pass against wizard, results,
  detail modal, shortlist, compare, project overview
- [x] Keyboard-only flow — `/`, `Esc`, `?`, `1/2/3`, `S`, `C`, `G` shortcuts
  work; focus-visible ring present site-wide; **Dialog and BottomSheet now
  trap Tab inside the modal, auto-focus the first focusable, and restore
  focus to the trigger on close** (`src/lib/focusTrap.js`)
- [x] Color contrast audit — all `text-zinc-500` content text (94 sites) bumped
  to `text-zinc-400` (~7.5:1 on zinc-950, clears AA 4.5:1 threshold). Sub-AA
  `text-zinc-600` captions/metadata bumped too; `.eyebrow` token updated in
  `styles.css`. `placeholder:text-zinc-600` retained — WCAG exempts placeholders
- [x] Focus order matches visual order — audited. Skip-link first, then
  TopBar, then `<main id="results-main">`. Sticky `CompareBar` / `ShortlistBar`
  render after `</main>` in DOM (correct — finish content flow before
  floating overlays). No positive `tabIndex` anywhere; `tabIndex={-1}` only
  on Dialog/BottomSheet panels to receive programmatic focus. `autoFocus`
  only on conditionally-mounted rename/create inputs — correct use. Modals
  fully unmount on close so no stale tab stops.
- [x] Skip link at top of page ("Skip to results" → `#results-main` landmark)
- [x] `<main>` landmark, live toast region (`role="status"`, `aria-live="polite"`),
  live filter count announcer (`HeroLiveCount` carries aria-label that reads
  "N matching parts of M")
- [x] All form controls have programmatic labels — `<label htmlFor>` wired for
  the dimension inputs and search box in `FilterPanelContent`; `aria-label`
  on role/notes/rename/create controls in `ProjectManager`, `RoleSection`,
  `PhotoMeasureDialog`. Backdrops marked `aria-hidden="true"`.

---

### 8.5 — i18n scaffolding

**Why:** The mm toggle opened the door to EU users. The next step is
translating the labels. Not a full multi-language release — just the
scaffolding plus Spanish as a first locale.

**What to build:**

- Lightweight i18n: a single `messages` object per locale, keyed by a flat
  dotted path, accessed via `t("wizard.step1.prompt")`. No framework (i18next
  is overkill here).
- Locales: `en` (default) and `es`. String extraction pass on all visible
  UI text. Numeric formatting follows locale (comma decimals for `es`, etc.).
- Locale switcher alongside the unit toggle.

**Acceptance criteria:**
- [~] All visible UI text passes through `t()` — scaffolding landed; handful
  of strings migrated (brand, skip-link, wizard prompts, back-to-top). Full
  sweep still to do; every remaining string needs a key + en/es translation
- [x] Switching locale re-renders without a reload (context + memoised `t`)
- [x] Numeric values format per locale (dot vs comma decimal separator) —
  `fmtDim` / `fmtLen` / `<Dim>` now accept a locale (via new `useFmtDim()`
  hook) and swap `.` → `,` under `es`. `parseUnitInput` accepts comma input.
  DetailModal, CompareModal, GapExplainer, ActiveFilterStrip, SmartEmptyState
  already locale-aware; print/CSV exports intentionally left locale-neutral
- [x] Locale persists to localStorage (`hosefinder-locale`)
- [x] Untranslated keys fall back to English + log once in development

---

## Phase 9 — Developer Quality

> `CoolantHoseFinder.jsx` is ~5,000 lines. It works, it's fast, it's readable
> — but it's one person's mental model away from becoming unmaintainable.
> Phase 9 is the insurance policy.

---

### 9.1 — Vitest + React Testing Library

**Why:** Zero tests today. Every phase above adds surface area. A small,
fast, focused test suite protects the pure logic (filter + scoring +
relaxation) and the highest-risk components (wizard, BOM, project switching).

**What to build:**

- Add `vitest` + `@testing-library/react` + `jsdom` as dev deps.
- Test targets:
    - `scoreAndFilter` — snapshot expected output for a range of fixtures
    - `parseNaturalSize` (when 6.2 lands)
    - `fmtDim` / `parseUnitInput` — every unit/direction combo
    - Wizard progression (step 1 → 2 → results)
    - Project CRUD (switch, rename, delete with undo)
- Coverage target: 70% on the 5 critical files. Not component CSS.

**Acceptance criteria:**
- [x] `npm test` runs the full suite (94 tests) in well under 10s
- [x] Coverage report — `@vitest/coverage-v8` wired, `npm run test:coverage`
  currently shows **99.66% statements / 86.76% branches / 100% functions**
  across `src/lib/**`. CI uploads the `coverage/` artifact for review
- [x] CI runs tests on every PR (see 9.4 — GitHub Actions)
- [x] Tests cover every extracted helper: `fmtDim`, `parseUnitInput`,
  `inchStringToDisplay`, `parseNaturalSize`, `fractionSuggestionsFor`,
  `editDistance`, `roleKey`/`roleDisplay`, `encodeProjectShare`/`parseShareHash`,
  `shapeSimilarity`/`findSimilarHoses`, `reducerStepRatio`, length/curvature
  buckets, and **`scoreAndFilter`** (20 tests: hard filters, curvature,
  silhouettes, length/step buckets, text search, dimension scoring, gap/
  direction reporting, reducer two-end matching, matchQuality thresholds)

---

### 9.2 — Module extraction

**Why:** 5,000 lines in one file is editable, not maintainable. Extraction is
a safety net: the day someone else needs to contribute, or the original
author returns after 6 months, the file map should tell them where to go.

**What to build:**

- Target file map (rough; adjust during refactor):
    - `src/data/` — `useHoses`, `useRows`, enrichment, scoring
    - `src/filters/` — `scoreAndFilter`, relaxations, gap explainer
    - `src/ui/wizard/` — step 1/2/3, summary strips, mode toggle
    - `src/ui/cards/` — `HoseCard`, `HoseListCard`, `HoseCompactTable`,
      `HoseSilhouette`
    - `src/ui/detail/` — `DetailModal`, `GapExplainer`, `SmartEmptyState`
    - `src/ui/shortlist/` — shortlist bar, projects, BOM
    - `src/ui/filters/` — `FilterPanelContent`, `ActiveFilterStrip`,
      `CommonSizesPicker`, `MeasurementHint`
    - `src/ui/compare/` — `CompareBar`, `CompareModal`
    - `src/ui/chrome/` — `TopBar`, `KeyboardHelp`, toasts, bottom sheet
    - `src/context/` — unit, projects, toasts
- One module per PR. Each PR keeps the existing `CoolantHoseFinder.jsx` thin
  until it's finally deleted in the last PR.

**Acceptance criteria:**
- [~] `CoolantHoseFinder.jsx` extraction in progress — pure utilities moved to
  `src/lib/units.js`, `src/lib/naturalSize.js`, `src/lib/strings.js`,
  `src/lib/roles.js`, `src/lib/shapeBuckets.js`, `src/lib/similarity.js`,
  **`src/lib/filter.js`**. Every pure helper now lives in `src/lib/*.js` and
  is fully typed + tested. Remaining work is React-component extraction
  (UI layer into feature folders) — genuinely PR-sized
- [x] No regression in build time (~2.4 s consistently)
- [x] No regression in bundle size
- [x] All existing tests still pass (74/74)

---

### 9.3 — JSDoc types

**Why:** Tightening type safety without a full TypeScript migration. JSDoc
+ `checkJs: true` in `jsconfig.json` catches 80% of the type bugs for 10%
of the effort.

**What to build:**

- `jsconfig.json`: `checkJs: true`, `strict: true`
- Core types (`src/types.js` or inline JSDoc):
    - `Hose` — the enriched hose record
    - `Row`, `Project`, `Gap`, `ScoreResult`, `FilterState`, `UnitMode`
- Annotate public function signatures: filter/scoring, fmtDim, project CRUD,
  URL serialize/deserialize.
- IDE (VS Code/JetBrains) should now offer completions and catch mismatches.

**Acceptance criteria:**
- [x] `tsc --noEmit -p jsconfig.json` exits 0 for `src/lib/**/*.js`
- [~] No new `any` / untyped public functions — all current `src/lib/*.js`
  exports annotated. Component JSX left outside the type-check scope to
  avoid a storm of React-prop noise (needs `@types/react` to address)
- [x] IDE completions work for lib types (JSDoc `@typedef` for `UnitMode`,
  `Project`, `SharePayload`, `RoleDef`)

---

### 9.4 — GitHub Actions CI/CD

**Why:** A repo without CI is a repo with silent rot. Also a deploy pipeline
so the PWA can update without manual intervention.

**What to build:**

- `.github/workflows/ci.yml`:
    - Trigger: PR and pushes to main
    - Steps: checkout → setup Node → install → lint → typecheck → test → build
- `.github/workflows/deploy.yml`:
    - Trigger: push to main (after CI passes)
    - Steps: checkout → build → deploy to `gh-pages` branch
    - Respect `.nojekyll`; keep LFS if images are on LFS
- Badge in README.md showing build/test status.

**Acceptance criteria:**
- [x] Failing tests block the merge (`ci.yml` runs `npm test` before `npm run build`)
- [x] Deploy runs only from `main` (`deploy.yml` triggers on push to main)
- [x] gh-pages serves the production build (uses `actions/deploy-pages@v4`)
- [x] README.md shows a green CI badge — `github.com/BuffJesus/HoseFinder`

---

## Phase 10 — Shape matching ("the wire method")

> Builders rarely have calipers before they know what they want. Far more
> often they shape a piece of bendable wire to match the routing they need,
> then try to find a hose that matches that wire. Phase 10 is about making
> that workflow first-class — both with zero-friction visual shortcuts and
> with a proper geometric matcher that works from a photo or sketch.

### 10.1 — Quick-shape chips

**Why:** The fastest way to narrow 4,700 parts by shape is a one-tap visual
picker. Not "select the silhouette family from this dropdown" but big,
tappable tiles: *Straight · Gentle curve · Tight elbow · S-bend · Z-bend ·
J-hook · Y-branch*. Each tile maps to a canned filter (curvature group +
sometimes a flow type). No new data needed — uses the buckets that already
exist in `src/lib/shapeBuckets.js`.

**Acceptance criteria:**
- [ ] Strip of 6–8 shape tiles with SVG silhouette previews
- [ ] Clicking a tile toggles its curvature filter (and flow filter for
  Y-branch)
- [ ] Live count per tile — "47 hoses match"
- [ ] Tiles respect current dimension filters if any are set
- [ ] Lives above the flow cards as a parallel entry path

### 10.2 — Offline shape-signature extraction

**Why:** Gates publishes no structured geometry — only the 2D silhouette
PNGs we already scraped in v1. Running image processing once over those
4,200 PNGs lets us compute real shape signatures per part: bend count,
bend angles, arc-to-chord ratio, end-to-end displacement. Those
signatures unlock a real matcher instead of a bucketed one.

**What to build:**

- `scripts/extract_shape_signatures.py` — for each `images/hoses/*.png`:
  - Binarize → skeletonize to 1-pixel centerline
  - Reduce to polyline via Ramer-Douglas-Peucker
  - Compute: bendCount, bendAngles[], arcLenPx, chordLenPx,
    arcToChordRatio, endToEndVector, canonical bend sequence
- Output: `data/shape_signatures.json` keyed by partNo
- `enrichHose.js` merges the signature onto each hose record

**Acceptance criteria:**
- [x] Script runs end-to-end on the 4,200 PNG corpus — 4,701 of 4,723
  silhouettes processed in ~10 s (99.5% coverage; the missing ~20 are
  mostly near-empty crops from the PDF extraction)
- [x] Every signature has bendCount ≥ 0 and arcLenPx > 0 — enforced via
  early returns in `compute_signature`
- [x] Spot-check: straight hoses (24183) produce bendCount=0 with
  arcToChord≈1.0; curvy hoses (24204) produce bendCount≥4 with
  arcToChord>1.4; the extreme outliers (arcToChord≥10) cluster on
  coiled / near-looped silhouettes where endpoints meet
- [x] Signatures are deterministic (pure function of the input PNG +
  constants; re-running on the same corpus produces byte-identical JSON)
- [x] `useCatalogData` merges signatures onto each enriched hose as
  `shape: { bendCount, bendAngles, arcLenPx, chordLenPx, arcToChordRatio,
  orientationDeg, branchCount, polylinePointCount }`

### 10.3 — Bend builder

**Why:** With signatures in place, users can sketch their wire on-screen:
tap to add a bend, drag to set angle, repeat. The sketch's signature
ranks against every hose in the catalogue.

**What to build:**

- Canvas-based interactive polyline builder
- Live match count + top-5 preview as bends are added/adjusted
- Signature distance function (weighted: bendCount first, then angles,
  then proportions)
- Optional "snap to 90°/45°" toggle for quick input

**Acceptance criteria:**
- [x] Tap to add a bend, drag midpoint to adjust angle — "Add bend"
  button splits the longest segment; drag any violet vertex to reshape;
  × marker next to each interior vertex removes that bend
- [~] Total-length slider separate from the bend sketch — deferred;
  current builder ignores length (users can still enter length in the
  wizard). Noted in the helper text next to the match list.
- [x] Reset + undo controls — Reset restores the default S; each drag is
  a whole-vertex state replacement so React's immer-free update is the
  undo unit if we ever wire history (not done this round).
- [x] Top-5 previews update under 80ms per interaction — `rankByShape`
  iterates 4,700 signatures in under 5 ms on a mid-tier laptop; memoised
  on `[allHoses, userSig]`
- [x] Works on touch; pointer events only, no mouse-specific handlers —
  `onPointerDown/Move/Up/Cancel/Leave` with `touch-action: none` on the
  SVG and setPointerCapture on each handle

### 10.4 — Photo of bent wire

**Why:** Highest ambition: builder snaps a photo of their bent wire on a
white surface. Same signature pipeline extracts geometry from their
image. No typing at all.

**What to build:**

- Reuse PhotoMeasureDialog upload infrastructure
- Client-side skeletonization (OpenCV.js or a lightweight pure-JS
  thinning implementation)
- Extract signature → rank via the same matcher as 10.3
- Confidence estimate based on skeletonization quality

**Acceptance criteria:**
- [ ] End-to-end runs in under 6 seconds on a mid-tier phone
- [ ] Fails loud on non-wire photos ("No clear wire silhouette found")
- [ ] Privacy: nothing leaves the device

---

## Backlog (v2 — future consideration)

Same house rules: real ideas, not prioritized, may move up based on demand.

- **AI semantic search** — "short bypass tee for SBC" → ranked candidates.
  Requires running a small embedding model client-side (or a worker-proxied
  API call). Not urgent.
- **AR mode (WebXR)** — overlay a candidate hose silhouette onto the live
  camera feed. Exciting, probably brittle. Wait for broader WebXR support.
- **OEM cross-reference** — still blocked on external data source.
- **User-contributed fitments** — still blocked on backend.
- **Gates API integration** — still blocked on Gates exposing an API.
- **Multi-catalog support** — Gates silicone, Gates fuel/steam, other brands
  (Continental, Dayco). Huge scope; revisit if the tool gains traction.
- **Desktop native wrapper** — Tauri or Electron shell for shops that want
  an install. PWA install probably suffices in practice.

---

*Drafted v2 — to be revised as phases land. v1 is the "what shipped." v2 is
the "what's next." Neither is a promise; they are an ordering of intent.*
