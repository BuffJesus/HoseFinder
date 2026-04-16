# HoseFinder — Development Roadmap

**Goal:** A hose finder that feels like a premium build tool, not a catalog punishment.
Intuitive, modern, beautiful, non-intimidating — but genuinely powerful for someone who
knows what they're doing.

**Current state (baseline):**
- `CoolantHoseFinder.jsx` — single React component, shadcn/ui + framer-motion
- `data/hoses.json` — 4,723 enriched part records
- `data/rows.json` — 663 shape row summaries
- `images/catalog/page-046.jpg` → `page-216.jpg` — 171 catalog page images
- `scripts/extract_data.py`, `scripts/extract_images.py` — PDF → data pipeline
- `index.html` — standalone static fallback (non-React)

**Design principles that must hold throughout every phase:**
1. One question at a time. Don't show the user something they don't need yet.
2. Live feedback. Never require clicking "Apply" or "Search".
3. Visuals before labels. A silhouette photo beats a row number. An SVG diagram
   beats a paragraph of instructions.
4. Fail gracefully and helpfully. No dead ends — every zero-result state has
   a clear next step.
5. The power is in the data. The app's real job is making 4,723 parts navigable.
   Every UI decision should serve that, not obscure it.

---

## Phase 1 — Entry Experience

> The first 10 seconds must feel easy. Right now a new user lands on a page
> with two sliders, six dropdowns, a search box, and 4,723 cards. This phase
> rebuilds the entry flow so users feel guided, not tested.

---

### 1.1 — Guided wizard replacing the visible filter sidebar

**Why:** The filter sidebar is a form. Forms are intimidating. A guided wizard
is a conversation. The information gathered is identical — the experience is
completely different.

**What to build:**

Replace the current `lg:grid-cols-[320px_minmax(0,1fr)]` layout with a stepped
flow controlled by a `step` state variable. The wizard has three steps:

```
step 1: hose type   →  step 2: your sizes  →  step 3: route length  →  results
```

Each step occupies the full content width. Results emerge live underneath once
the user has provided at least one dimension (step 2). Steps are not "pages" —
they're progressive disclosure. Completed steps collapse into a small summary
strip that can be tapped to re-open.

**Implementation sketch:**

```jsx
// New state in CoolantHoseFinder
const [step, setStep] = useState(1);          // 1 | 2 | 3 | 'results'
const [wizardMode, setWizardMode] = useState(true); // false = advanced/power mode

// Step 1: rendered as the three existing flow cards — no change to the cards
// themselves, just promoted to full-screen with nothing else visible.

// Step 2: just two inputs — End 1 and End 2 (conditionally shown based on
// flow === "reducer" or flow === "branched"). Plus the inline SVG helper.
// Auto-advance to step 3 when both required inputs are filled.

// Step 3: single length input + tolerance. "Skip" button advances to results
// with tolerance set to "any".

// The existing filter sidebar becomes the "Advanced mode" panel, hidden
// behind a toggle for users who want all controls at once.
```

**The "Advanced mode" escape hatch:**

Keep all existing filter controls exactly as-is. Add a toggle at the top:

```jsx
// Small button above results
<button onClick={() => setWizardMode(false)}>
  Advanced filters
</button>
```

When `wizardMode === false`, show the full existing sidebar. When `wizardMode === true`,
show only the three wizard steps. This means no existing functionality is removed —
it's just not the default entry point.

**Acceptance criteria:**
- [x] First-time visitor sees only the three flow cards and nothing else
- [x] Selecting a flow card advances immediately to step 2
- [x] Step 2 shows the relevant inputs (1 input for single, 2 for reducer/branched)
- [x] Results begin updating live the moment any dimension is entered
- [x] Completed steps collapse to a one-line summary: `Type: Reducer · End 1: 1.50"`
- [x] "Advanced filters" toggle bypasses wizard entirely and shows current sidebar
- [x] Wizard state survives tab changes (going to shape browser and back)

---

### 1.2 — Live filtering as you type

**Why:** The current flow has a `filterParams` object built from state, and
`useMemo` correctly recomputes `filtered` on every state change. The filtering
IS already live — but the UX doesn't communicate this. Adding a live result
count that animates makes the responsiveness visible and removes any
"do I need to press enter?" anxiety.

**What to build:**

Add a live counter below each dimension input:

```jsx
// Below the End 1 diameter input
{targetId1 !== "" && (
  <div className="mt-1 text-xs text-violet-400">
    <AnimatedCount value={filteredByIdOnly.length} /> hoses match this diameter
  </div>
)}
```

Where `filteredByIdOnly` is a fast pre-filter that ignores length (so the count
updates immediately while the user is still typing length).

Also add a rolling count in the results header that animates on change:

```jsx
// Replace static count in results header
<motion.span
  key={filtered.length}
  initial={{ opacity: 0, y: -4 }}
  animate={{ opacity: 1, y: 0 }}
>
  {filtered.length.toLocaleString()}
</motion.span>
```

**Acceptance criteria:**
- [x] Per-field result counts appear as soon as a value is entered
- [x] Main result count animates on every filter change
- [x] No visible lag — filtering 4,723 records must complete in < 16ms
  (verify with `console.time` in development; `scoreAndFilter` is O(n) and fast,
  but watch out if enrichment is being re-run on every render)
- [x] Debounce dimension inputs at 150ms to avoid thrashing on fast typists

---

### 1.3 — Inline measurement helper SVGs

**Why:** "Measure the outside diameter of the metal fitting neck" is a sentence.
A small SVG showing a caliper on a stub with an arrow is a picture. Hot rodders
trust pictures.

**What to build:**

A `MeasurementHint` component that renders inline next to the relevant input,
collapsed by default, expanding on hover or focus:

```jsx
function MeasurementHint({ type }) {
  // type: "id" | "length"
  // Renders a small SVG diagram that shows exactly where to measure
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-zinc-500 hover:text-violet-400 transition"
        aria-label="How to measure"
      >
        {/* small ruler icon */}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="absolute left-0 top-8 z-50 w-64 rounded-2xl
                                  border border-white/10 bg-zinc-900 p-4 shadow-xl">
            {type === "id" && <IdMeasurementSVG />}
            {type === "length" && <LengthMeasurementSVG />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IdMeasurementSVG() {
  // SVG showing a cross-section of a metal stub with a dimension line
  // indicating the outside diameter (= hose inside diameter to order)
  // Caption: "Measure the O.D. of the metal neck — order a hose with matching I.D."
  return (
    <svg viewBox="0 0 220 120">
      {/* pipe cross-section, dimension arrow, label */}
    </svg>
  );
}

function LengthMeasurementSVG() {
  // SVG showing a curved routing path (not straight line) between two stubs
  // with a flexible tape following the curve
  // Caption: "Follow the actual route — a straight-line measurement always undershoots."
  return (
    <svg viewBox="0 0 220 120">
      {/* two stubs, curved path, tape measure overlay */}
    </svg>
  );
}
```

**Acceptance criteria:**
- [x] Hint icon appears to the right of each dimension input label
- [x] Hovering or focusing the icon opens the SVG hint
- [x] I.D. hint shows cross-section of a metal stub with O.D. callout
- [x] Length hint shows a curved routing path (not straight line) with tape
- [x] Both hints include a one-line caption
- [x] Hints don't obscure the input on mobile — render below on small screens

---

### 1.4 — Smart empty state with automatic tolerance relaxation

**Why:** A blank results area is a dead end. It should be a starting point for
the next search, not a failure message.

**What to build:**

When `filtered.length === 0` and at least one dimension filter is active,
replace the current empty state with an automatic suggestion engine:

```jsx
function SmartEmptyState({ targetId1, targetId2, targetLen, allHoses }) {
  // Try progressively relaxed filters until we find results
  const suggestions = useMemo(() => {
    const relaxations = [
      { idTol: 0.1,  lenTol: 3,   label: "ID ±0.10\", length ±3\"" },
      { idTol: 0.15, lenTol: 5,   label: "ID ±0.15\", length ±5\"" },
      { idTol: 0.2,  lenTol: 999, label: "ID ±0.20\", any length"  },
      { idTol: 999,  lenTol: 3,   label: "exact length, any diameter" },
    ];
    for (const r of relaxations) {
      const results = allHoses
        .map(h => scoreAndFilter(h, { targetId1, targetId2, targetLen,
                                       idTol: r.idTol, lenTol: r.lenTol,
                                       hoseTypeFilter: "all", sizeBandFilter: "all",
                                       endCountFilter: "all", flow: "all", search: "" }))
        .filter(Boolean);
      if (results.length > 0) return { results: results.slice(0, 4), label: r.label };
    }
    return null;
  }, [targetId1, targetId2, targetLen, allHoses]);

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center">
      <div>No exact matches for your spec.</div>
      {suggestions && (
        <>
          <div>Loosening to {suggestions.label} finds {suggestions.results.length}+ hoses:</div>
          <div className="grid gap-3 mt-4">
            {suggestions.results.map(h => <HoseCard key={h.partNo} hose={h} ... />)}
          </div>
          <Button onClick={() => applyRelaxedFilters(suggestions)}>
            Show all {suggestions.results.length}+ results with these tolerances
          </Button>
        </>
      )}
    </div>
  );
}
```

**Acceptance criteria:**
- [x] Empty state never just says "no results" — always shows nearest alternatives
- [x] Nearest alternatives are calculated automatically (no user action required)
- [x] "Apply these tolerances" button updates the live filter state
- [x] Shows what dimension was relaxed and by how much
- [x] If truly no results exist (e.g. diameter 9.99"), shows the closest part
  by a single-dimension match with clear explanation

---

## Phase 2 — Visual Experience

> The core promise of this tool is "find the right shape." Phase 2 makes the
> visual experience match that promise. This is where the app goes from
> functional to memorable.

---

### 2.1 — Individual hose image crops from catalog pages

**Why:** Every result card currently shows a full catalog page image scaled
tiny — 6 hoses crammed into a thumbnail. This is barely better than showing
no image. Cropped individual silhouettes make the shape comparison immediate
and real.

**The catalog structure (from PDF analysis):**

Each catalog page (PDF pages 46–216, stored as `images/catalog/page-XXX.jpg`)
contains 4 rows of hoses, 5–9 hoses per row. Each hose image is a black
silhouette on white. The part number, I.D., and length appear as text directly
below each image.

**The extraction pipeline** (`scripts/extract_hose_images.py`):

```python
import fitz  # PyMuPDF
import json, os
from PIL import Image

doc = fitz.open("data/guide.pdf")

# For each visual catalog page (PDF pages 46-216, 0-indexed 45-215)
for pdf_page_num in range(45, 216):
    page = doc[pdf_page_num]
    words = page.get_text("words")  # [x0, y0, x1, y1, text, ...]

    # Find all 5-digit part numbers and their positions
    part_positions = [
        {"partNo": w[4], "x": (w[0]+w[2])/2, "y": w[1]}
        for w in words if re.match(r"^\d{5}$", w[4])
    ]

    # Get image objects with their bounding boxes
    img_list = page.get_images(full=True)
    for img_info in img_list:
        xref = img_info[0]
        rects = page.get_image_rects(xref)
        if not rects: continue
        rect = rects[0]

        # Skip tiny images (margin marks, decorative elements)
        if rect.height < 40 or rect.width < 8: continue

        # Find the part number text closest below this image
        nearest = find_nearest_part(rect, part_positions)
        if not nearest: continue

        # Rasterize a tight crop around this image at 150 DPI
        # Add padding: 8px left/right, 4px top, 16px bottom (includes part no.)
        clip = fitz.Rect(rect.x0 - 8, rect.y0 - 4, rect.x1 + 8, rect.y1 + 40)
        mat = fitz.Matrix(150/72, 150/72)
        pix = page.get_pixmap(matrix=mat, clip=clip)

        # Save as PNG with transparency (hoses are black on white — easy to key)
        out_path = f"images/hoses/{nearest['partNo']}.png"
        pix.save(out_path)

print(f"Extracted images for {len(os.listdir('images/hoses/'))} parts")
```

**Expected output:** ~4,200 individual PNG files in `images/hoses/`, averaging
3–8 KB each (black silhouettes compress extremely well). Total: ~30–50 MB.

**Integration in `CoolantHoseFinder.jsx`:**

```jsx
// In HoseCard — replace catalog page image with individual hose image
function hoseImgSrc(partNo) {
  return `images/hoses/${partNo}.png`;
}

// In ImageTile — try individual image first, fall back to catalog page,
// then fall back to generated SVG silhouette
<img
  src={hoseImgSrc(hose.partNo)}
  onError={(e) => {
    e.target.src = catalogImgSrc(hose.catalogPage);
    e.target.onerror = () => { e.target.style.display = "none"; };
  }}
  className="max-h-32 w-auto object-contain"
  alt={`Gates ${hose.partNo} silhouette`}
/>
```

**Notes:**
- The PyMuPDF `find_nearest_part` function exists in the extraction analysis
  already — see the notes from the original PDF exploration session.
- Some hoses are split across multiple image fragments in the PDF (stored as
  separate objects). The extraction may miss these or produce partial images.
  Filtering by file size after extraction (skip < 500 bytes) removes empties.
- Coverage estimate: ~85–90% of parts will get clean individual images.
  The remaining ~10% fall back to catalog page gracefully.

**Acceptance criteria:**
- [x] `scripts/extract_hose_images.py` runs to completion without errors
- [x] At least 3,500 individual hose PNGs exist in `images/hoses/`
- [x] Each card shows its specific hose silhouette, not the full catalog page
- [x] Images are white/transparent backgrounds (invert black silhouette if needed
  for dark theme legibility: use CSS `filter: invert(1)` on dark backgrounds)
- [x] Graceful fallback chain: individual image → catalog page → SVG silhouette
- [x] GitHub Pages serves images correctly (check `.nojekyll` file in repo root)

---

### 2.2 — Shape-first entry mode (visual catalog browser)

**Why:** Not every user starts with calipers. Someone replacing a hose on an
unfamiliar engine, or sourcing for a custom build that doesn't exist yet, wants
to say "it looks like this" — not enter numbers. The catalog page images are
already available; they just need to be surfaced as a browsable grid.

**What to build:**

Add a second primary entry point alongside the wizard: a full-width visual grid
of catalog page thumbnails. Each thumbnail covers ~4 shape rows. The user clicks
pages whose bend profiles match their application, which sets `selectedRows` and
filters the dimension results.

This feature already has partial scaffolding in `index.html` (the static version).
Port it into the React component:

```jsx
// New state
const [shapeMode, setShapeMode]   = useState(false);   // toggle shape browser
const [selectedRows, setSelectedRows] = useState(new Set()); // rowNo Set

// Build page → rows mapping from rows.json (already fetched)
const pageMap = useMemo(() => {
  const m = {};
  allRows.forEach(row => {
    const pg = row.catalogPage;
    if (!m[pg]) m[pg] = { page: pg, rows: [], count: 0 };
    m[pg].rows.push(row.rowNo);
    m[pg].count += row.count;
  });
  return Object.values(m).sort((a, b) => a.page - b.page);
}, [allRows]);

// Shape grid component
function ShapeGrid({ pageMap, selectedRows, onToggle }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {pageMap.map(pg => (
        <button
          key={pg.page}
          onClick={() => onToggle(pg.rows)}
          className={`overflow-hidden rounded-2xl border transition
            ${pg.rows.some(r => selectedRows.has(r))
              ? "border-violet-400 ring-2 ring-violet-500/30"
              : "border-zinc-800 hover:border-zinc-600"}`}
        >
          <img
            src={`images/catalog/page-${String(pg.page).padStart(3,"0")}.jpg`}
            className="w-full aspect-[3/4] object-cover object-top"
            loading="lazy"
            alt={`Shape rows ${Math.min(...pg.rows)}–${Math.max(...pg.rows)}`}
          />
          <div className="p-2 text-xs text-zinc-400 text-center bg-zinc-900">
            Rows {Math.min(...pg.rows)}–{Math.max(...pg.rows)}
            <span className="text-zinc-600"> · {pg.count}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**UX flow:**

```
[Browse by shape] button (alongside "Start browsing" in hero)
  → Shape grid opens (full width, scrollable)
  → User clicks 1–3 pages that look like their routing
  → "Show 47 hoses in these shapes →" button appears
  → Clicking it closes shape grid, shows filtered results
  → User can still refine by dimension in the wizard strip above results
```

**Note:** `data/rows.json` is already fetched and available. Add it to the
`useEffect` fetch alongside `hoses.json`.

**Acceptance criteria:**
- [x] "Browse by shape" is a primary entry point visible without scrolling
- [x] Shape grid loads lazily (images use `loading="lazy"`)
- [x] Multi-select: clicking additional pages adds to selection, not replaces
- [x] Selected pages have a clear visual indicator (ring or checkmark)
- [x] Result count updates live as pages are selected
- [x] Selected shape rows combine with dimension filters (AND, not OR)
- [x] "Clear shape selection" resets without clearing dimension filters

---

### 2.3 — Match gap explanation

**Why:** "Close fit" tells the user something is close. It doesn't tell them
whether close is good enough. "Diameter exact — length is 1.8\" longer, fine
for custom routing with slack" is actually actionable.

**What to build:**

Extend `scoreAndFilter` to return a structured gap object alongside the score:

```js
// In scoreAndFilter, build this before returning:
const gap = {
  idDelta:  idPenalty,         // float, inches
  lenDelta: lenPenalty,        // float, inches
  idExact:  idPenalty < 0.02,
  lenExact: lenPenalty < 0.5,
};
return { ...hose, _score: totalScore, _matchQuality: matchQuality, _gap: gap };
```

Then render the gap in the detail modal and on card hover:

```jsx
// In MatchBadge or a new GapExplainer component
function GapExplainer({ gap, targetId1, targetLen }) {
  if (!gap) return null;
  const lines = [];
  if (gap.idExact)  lines.push("Diameter: exact match");
  else              lines.push(`Diameter: ${gap.idDelta.toFixed(2)}" off spec`);
  if (gap.lenExact) lines.push("Length: exact match");
  else if (targetLen !== "") {
    const dir = gap._originalLen > parseFloat(targetLen) ? "longer" : "shorter";
    lines.push(`Length: ${gap.lenDelta.toFixed(1)}" ${dir} than your spec`);
  }
  return (
    <div className="mt-2 space-y-1 text-xs text-zinc-400">
      {lines.map(l => <div key={l}>{l}</div>)}
    </div>
  );
}
```

Add `_originalLen` and `_originalId` to the gap object so the direction
(longer/shorter, larger/smaller) can be shown.

**Acceptance criteria:**
- [x] Detail modal shows the gap breakdown for every filtered result
- [x] Direction is shown: "1.8\" longer" not just "1.8\" off"
- [x] Exact matches show "exact match" in green, not a delta of 0
- [x] Gap section is hidden when no filters are active (unfiltered browse)

---

### 2.4 — Card density toggle (grid / list / compact)

**Why:** Different tasks need different densities. Visual shopping → grid.
Narrowing down 20 candidates → list. Scanning part numbers after you know
what you want → compact table.

**What to build:**

Three view modes controlled by a `viewMode` state:

```jsx
// 'grid': current 3-column card layout
// 'list': 1-column, card is horizontal (image left, specs right)
// 'compact': pure table, no images, 8 rows visible before scroll

const VIEW_MODES = ['grid', 'list', 'compact'];

// In list mode, HoseCard renders horizontally:
// [silhouette 80px] | [part no + shape label] | [ID] | [length] | [type] | [compare btn]

// In compact mode, skip cards entirely and render a plain table:
{viewMode === 'compact' && (
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-white/10 text-zinc-500 text-xs">
        <th className="text-left py-2">Part</th>
        <th className="text-left py-2">I.D.</th>
        <th className="text-left py-2">Length</th>
        <th className="text-left py-2">Type</th>
        <th className="text-left py-2">Shape</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {paginated.map(hose => (
        <tr key={hose.partNo} className="border-b border-white/5 hover:bg-white/5
                                          cursor-pointer" onClick={() => setSelected(hose)}>
          <td className="py-2 font-semibold">{hose.partNo}</td>
          <td className="py-2">{hose.hoseId}"</td>
          <td className="py-2">{hose.length}"</td>
          <td className="py-2 capitalize">{hose.hoseType}</td>
          <td className="py-2 text-zinc-400">{hose.visualFamily}</td>
          <td className="py-2">
            <MatchBadge quality={hose._matchQuality} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}
```

**Acceptance criteria:**
- [x] Three-way toggle renders correctly in all view modes
- [x] List mode shows silhouette thumbnail + all key specs in one horizontal row
- [x] Compact mode is a scannable table with clickable rows opening detail modal
- [x] Selected view mode persists in `localStorage`
- [x] Mobile defaults to list (grid is too cramped, compact lacks visual context)

---

## Phase 3 — Power Features

> These features add serious leverage for return users, shop technicians, and
> builders doing serious parts research. They layer on top of the existing flow
> without touching the first-time experience.

---

### 3.1 — Shortlist and printable parts list

**Why:** The real end of the user's journey isn't opening a detail modal — it's
placing an order. A shortlist that produces a print-ready page bridges the gap
between "found it in the app" and "ordered it from the counter."

**What to build:**

A `shortlist` state (Set of partNos, persisted in `localStorage`):

```jsx
const [shortlist, setShortlist] = useState(() => {
  try {
    return new Set(JSON.parse(localStorage.getItem("hosefinder-shortlist") || "[]"));
  } catch { return new Set(); }
});

const toggleShortlist = useCallback((partNo) => {
  setShortlist(prev => {
    const next = new Set(prev);
    next.has(partNo) ? next.delete(partNo) : next.add(partNo);
    localStorage.setItem("hosefinder-shortlist", JSON.stringify([...next]));
    return next;
  });
}, []);
```

The shortlist panel: a collapsible drawer on the right side, or a floating
bottom bar similar to the compare bar. Shows the saved parts as compact rows
with a "Print list" button:

```jsx
function printShortlist(shortlistedHoses) {
  const rows = shortlistedHoses.map(h =>
    `<tr>
      <td>${h.partNo}</td>
      <td>${h.hoseId}"</td>
      <td>${h.length}"</td>
      <td>${h.hoseType}</td>
      <td>${h.visualFamily}</td>
     </tr>`
  ).join("");

  const html = `<!DOCTYPE html>
    <html><head><title>HoseFinder — Parts List</title>
    <style>
      body { font-family: sans-serif; padding: 2rem; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
      th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
      h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
      p  { font-size: 0.8rem; color: #666; margin-bottom: 1.5rem; }
    </style></head>
    <body>
      <h1>Gates Molded Coolant Hose — Parts List</h1>
      <p>Generated ${new Date().toLocaleDateString()} · ${shortlistedHoses.length} parts</p>
      <table>
        <thead><tr><th>Part #</th><th>I.D.</th><th>Length</th><th>Type</th><th>Shape</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.print();
}
```

**Acceptance criteria:**
- [x] Bookmark icon on each card adds/removes from shortlist
- [x] Shortlist count shown in a persistent badge (top right or bottom bar)
- [x] Print sheet opens in a new tab with clean formatting, no UI chrome
- [x] Shortlist survives page refresh (localStorage)
- [x] Max 20 items in shortlist (show warning at 20, prevent adding more)
- [x] "Clear shortlist" button with confirmation

---

### 3.2 — "All hoses in this shape" quick filter

**Why:** Someone who finds a close match often wants to see the full shape
family — every hose with the same bend profile at different diameters and
lengths. One click should surface all of them, ranked by how close they are
to the user's dimensions.

**What to build:**

A button in `HoseCard` and on the detail modal:

```jsx
// In HoseCard footer, next to the existing "Open detail view" button
<Button
  variant="ghost"
  onClick={(e) => {
    e.stopPropagation();
    onShowRow(hose.rowNo);  // new prop: (rowNo: number) => void
  }}
  className="text-xs text-zinc-500 hover:text-zinc-300"
>
  All {rowCounts[hose.rowNo] || "?"} in this shape
</Button>
```

`onShowRow` sets a single-row filter:

```jsx
// In CoolantHoseFinder
const showRow = useCallback((rowNo) => {
  setSelectedRows(new Set([rowNo]));
  setFlow("all");
  // Don't clear dimensions — user may want to see the shape family
  // filtered to their size range
  setPage(1);
}, []);
```

Pre-compute `rowCounts` from `allHoses`:

```jsx
const rowCounts = useMemo(() =>
  allHoses.reduce((acc, h) => {
    acc[h.rowNo] = (acc[h.rowNo] || 0) + 1;
    return acc;
  }, {}),
[allHoses]);
```

**Acceptance criteria:**
- [x] Button shows accurate count ("All 7 in this shape")
- [x] Clicking filters immediately, no page reload
- [x] Active row filter appears as a dismissable pill in the filter strip
- [x] Works from both the card and the detail modal
- [x] "All N in this shape" button is visible but secondary — doesn't
  compete with the main "Open detail view" CTA

---

### 3.3 — Common application presets

**Why:** "SBC 350 upper radiator hose" is a valid starting point that
pre-fills End 1: 1.50", End 2: 1.75", Length: ~16–20", Type: Reducer.
A builder who knows their platform shouldn't have to know the specs to use
the tool. Presets make this tool useful before the tape measure comes out.

**What to build:**

A `PRESETS` array and a `PresetsStrip` component shown above the wizard
on first load (dismissed after first use):

```jsx
const PRESETS = [
  {
    label: "SBC 350/305",
    sub:   "Upper radiator",
    targetId1: "1.50", targetId2: "1.75",
    targetLen: "17", lenTol: 3, idTol: 0.06,
    flow: "reducer",
    icon: "engine",   // small SVG
  },
  {
    label: "LS swap",
    sub:   "Upper radiator",
    targetId1: "1.50", targetId2: "1.50",
    targetLen: "18", lenTol: 4, idTol: 0.06,
    flow: "single",
    icon: "engine",
  },
  {
    label: "BBC 454",
    sub:   "Upper radiator",
    targetId1: "1.75", targetId2: "1.75",
    targetLen: "22", lenTol: 4, idTol: 0.08,
    flow: "single",
    icon: "engine",
  },
  {
    label: "Heater bypass",
    sub:   "Small block",
    targetId1: "0.75", targetId2: "",
    targetLen: "8", lenTol: 3, idTol: 0.06,
    flow: "single",
    icon: "heater",
  },
  {
    label: "Heater core",
    sub:   "Universal",
    targetId1: "0.75", targetId2: "",
    targetLen: "20", lenTol: 5, idTol: 0.06,
    flow: "single",
    icon: "heater",
  },
  {
    label: "Degas / overflow",
    sub:   "Universal",
    targetId1: "0.63", targetId2: "",
    targetLen: "15", lenTol: 5, idTol: 0.08,
    flow: "single",
    icon: "bottle",
  },
];

function applyPreset(preset) {
  setTargetId1(preset.targetId1);
  setTargetId2(preset.targetId2);
  setTargetLen(preset.targetLen);
  setLenTol([preset.lenTol]);
  setIdTol([preset.idTol]);
  setFlow(preset.flow);
  setStep("results");
  setWizardMode(false);  // show sidebar so user can see what was set
}
```

**Notes on preset dimensions:** Cross-reference against the actual dataset before
shipping. Verify each preset returns a meaningful number of results
(target: 8–30 for a useful preset). Adjust tolerances if needed. The specs
above are typical but not universal — they'll vary by year and specific engine
variant.

**Acceptance criteria:**
- [x] Presets strip visible on first load, hidden after first interaction
- [x] "Start from a preset" link brings it back after dismissal
- [x] Each preset card shows the pre-filled specs (so user knows what they're getting)
- [x] Applying a preset immediately shows results (no additional steps required)
- [x] Presets do not overwrite manually entered values without confirmation
- [x] At least one branched preset (e.g. bypass tee with 3 ends)

---

### 3.4 — Recently viewed (localStorage)

**Why:** A builder who is comparing 4–5 candidate hoses across multiple sessions
shouldn't have to re-navigate to each one. Recently viewed is a zero-backend
feature that makes the app feel like it knows you.

**What to build:**

```jsx
const MAX_RECENT = 8;

// Whenever a hose detail modal is opened:
useEffect(() => {
  if (!selected) return;
  const stored = JSON.parse(localStorage.getItem("hosefinder-recent") || "[]");
  const updated = [selected.partNo, ...stored.filter(p => p !== selected.partNo)]
    .slice(0, MAX_RECENT);
  localStorage.setItem("hosefinder-recent", JSON.stringify(updated));
}, [selected?.partNo]);

// On load:
const [recentPartNos] = useState(() =>
  JSON.parse(localStorage.getItem("hosefinder-recent") || "[]")
);

const recentHoses = useMemo(
  () => recentPartNos.map(p => allHoses.find(h => h.partNo === p)).filter(Boolean),
  [recentPartNos, allHoses]
);
```

Render as a horizontal scroll strip above the results grid, only when
`recentHoses.length > 0` and no dimension filters are active (i.e. browsing mode):

```jsx
{recentHoses.length > 0 && !hasActiveFilters && (
  <div className="mb-6">
    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
      Recently viewed
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2">
      {recentHoses.map(h => (
        <button
          key={h.partNo}
          onClick={() => setSelected(h)}
          className="flex-shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900
                     px-4 py-3 text-left hover:border-zinc-600 transition"
        >
          <div className="font-semibold text-white text-sm">{h.partNo}</div>
          <div className="text-xs text-zinc-500">{h.hoseId}" · {h.length}"</div>
        </button>
      ))}
    </div>
  </div>
)}
```

**Acceptance criteria:**
- [x] Strip appears on return visits when localStorage has entries
- [x] Strip is hidden when dimension filters are active (results context)
- [x] Strip is hidden when there are zero recently viewed items (first visit)
- [x] Clicking any recent card opens its detail modal immediately
- [x] Recently viewed persists across sessions
- [x] At most 8 items shown; oldest drops off as new ones are added

---

## Phase 4 — Polish

> The finishing moves. None of these are large changes. Together they're
> the difference between a useful prototype and a tool someone recommends.

---

### 4.1 — Mobile-first layout pass

**Why:** The most common real-world scenario is a phone at the parts counter
or under the hood. The current layout has a fixed 320px sidebar that collapses
catastrophically on narrow screens.

**What to build:**

Replace the `lg:grid-cols-[320px_minmax(0,1fr)]` sidebar layout with a
bottom sheet pattern on mobile:

```jsx
// Detect mobile
const isMobile = useMediaQuery("(max-width: 768px)");

// On mobile: filters in a bottom sheet
{isMobile ? (
  <>
    {/* Results fill full width */}
    <div className="w-full">{/* result cards */}</div>

    {/* Filter trigger button */}
    <button
      onClick={() => setFilterSheetOpen(true)}
      className="fixed bottom-20 right-4 z-30 flex items-center gap-2
                 rounded-full bg-violet-600 px-5 py-3 text-white
                 shadow-lg shadow-violet-900/50"
    >
      <SlidersHorizontal className="h-4 w-4" />
      Filters {hasActiveFilters && <span className="ml-1 font-bold">·</span>}
    </button>

    {/* Bottom sheet (slides up from bottom) */}
    <AnimatePresence>
      {filterSheetOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px]
                     bg-zinc-900 border-t border-white/10 p-6 max-h-[85vh] overflow-y-auto"
        >
          {/* Full filter panel content, same as desktop sidebar */}
        </motion.div>
      )}
    </AnimatePresence>
  </>
) : (
  <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
    {/* Desktop: sidebar + results */}
  </div>
)}
```

**Card sizing on mobile:**

```jsx
// Results grid on mobile: single column for list, 2-col for grid
<div className={`grid gap-3 
  ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}
`}>
```

**Touch targets:** All interactive elements must be at least 44×44px. The
current `Compare` button on cards is too small — increase its touch target or
replace with a bookmark icon that's easier to tap.

**Acceptance criteria:**
- [x] On screens < 768px, filters are in a bottom sheet behind a FAB
- [x] Bottom sheet dismisses by tapping the overlay or dragging down
- [x] Result cards on mobile are 2-column grid (not 3)
- [x] All tap targets meet 44px minimum
- [x] Compare bar + shortlist bar don't overlap on mobile
- [x] Wizard steps are full-width and comfortable to interact with on touch

---

### 4.2 — Active filter summary strip

**Why:** Users lose track of what's filtered, especially after using a preset
or arriving via a deep-linked URL. A persistent strip above results makes
the current filter state explicit and gives a clear path to remove
individual filters.

**What to build:**

```jsx
function ActiveFilterStrip({ targetId1, targetId2, targetLen, idTol, lenTol,
                              flow, selectedRows, onClearId, onClearLen,
                              onClearType, onClearRows }) {
  const pills = [];

  if (targetId1) {
    const id2 = targetId2 ? ` × ${targetId2}"` : "";
    pills.push({
      label: `ID ${targetId1}"${id2} ±${idTol}"`,
      onRemove: onClearId,
    });
  }

  if (targetLen) {
    const tolStr = lenTol >= 99 ? "any length" : `±${lenTol}"`;
    pills.push({
      label: `Length ${targetLen}" ${tolStr}`,
      onRemove: onClearLen,
    });
  }

  if (flow !== "all") {
    const labels = { single: "Same-size", reducer: "Reducer", branched: "Branched" };
    pills.push({ label: labels[flow], onRemove: onClearType });
  }

  if (selectedRows.size > 0) {
    pills.push({
      label: `${selectedRows.size} shape${selectedRows.size > 1 ? "s" : ""} selected`,
      onRemove: onClearRows,
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {pills.map(pill => (
        <span key={pill.label}
          className="inline-flex items-center gap-1.5 rounded-full border
                     border-violet-500/30 bg-violet-500/10 px-3 py-1
                     text-xs text-violet-300">
          {pill.label}
          <button onClick={pill.onRemove} className="text-violet-400
                                                      hover:text-violet-200">
            ×
          </button>
        </span>
      ))}
      <span className="text-xs text-zinc-500 ml-1">
        {filtered.length.toLocaleString()} results
      </span>
    </div>
  );
}
```

**Acceptance criteria:**
- [x] Strip is invisible when no filters are active
- [x] Each active filter shows as a removable pill
- [x] Result count appears at the end of the pill row
- [x] Removing a pill updates filters immediately (no apply step)
- [x] Presets set via preset cards also show up as removable pills

---

### 4.3 — Keyboard navigation

**Why:** Fast. Especially for power users who know what they want and are
moving through candidates quickly.

**Shortcuts to implement:**

| Key | Action |
|-----|--------|
| `/` | Focus the part number search input |
| `Escape` | Close modal, clear search, collapse filter sheet |
| `←` `→` | Navigate between result cards (when cards are focused) |
| `Enter` | Open selected card's detail modal |
| `S` | Toggle shortlist for the focused card |
| `C` | Toggle compare for the focused card |
| `?` | Open measurement guide |

```jsx
// Global keydown handler
useEffect(() => {
  const handler = (e) => {
    // Don't intercept when typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.key === "/") {
      e.preventDefault();
      document.querySelector("#part-search-input")?.focus();
    }
    if (e.key === "Escape") {
      setSelected(null);
      setFilterSheetOpen(false);
    }
    if (e.key === "?") setShowGuide(true);
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

**Acceptance criteria:**
- [x] `/` focuses part number search from anywhere on the page
- [x] `Escape` dismisses any open modal or sheet
- [x] `?` opens the measurement guide
- [x] Keyboard shortcuts don't fire while focus is inside an input
- [x] A small keyboard shortcut hint is visible somewhere (tooltip or footer)

---

### 4.4 — Gates.com link on part cards

**Why:** The app finds the match. The user orders through Gates or a Gates
distributor. A direct link to the part on Gates.com closes the loop without
requiring any backend.

**What to build:**

```jsx
// In DetailModal actions
<a
  href={`https://www.gates.com/us/en/search.html?q=${hose.partNo}`}
  target="_blank"
  rel="noopener noreferrer"
  className="modal-action-btn modal-action-secondary flex items-center gap-2"
>
  View on Gates.com
  <ExternalLink className="h-3 w-3" />
</a>
```

Also add a small link icon to the compact table row and list view card.

**Note:** Gates' search URL structure may change. Test the link before shipping.
If the direct part URL is available (e.g. `/parts/PARTNUMBER`), prefer that over
a search query.

**Acceptance criteria:**
- [x] Link opens in new tab
- [x] Link appears in detail modal and compact table row
- [x] Link is not prominent on grid cards (space is limited) — icon only
- [x] If link format changes, it's defined in a single `gatesUrl(partNo)` helper

---

## Implementation notes

### State management

The current single-component state works fine for the current scale. If the
component grows past ~1,200 lines, consider extracting into:

- `useHoseData()` — data loading, enrichment, `allHoses`, `allRows`
- `useFilters()` — all filter state + `filtered` computed list
- `useUI()` — `selected`, `compare`, `shortlist`, `viewMode`, `step`

This keeps `CoolantHoseFinder` as a thin composition layer.

### Performance

4,723 records × O(n) filter = fast. The current `scoreAndFilter` runs in
under 5ms. Watch for:

- **Re-enrichment on every render:** `useMemo(() => rawHoses.map(enrichHose), [rawHoses])`
  is correct — enrichment only runs when `rawHoses` changes (once, on load).
- **Suggestion computation:** The `suggestions` memo in the detail modal
  scans all 4,723 hoses on every `selected` change. Still fast, but add
  `allHoses` to the dependency array to be explicit.
- **Image loading:** With individual hose PNGs, the grid could attempt
  to load 24 images at once. All `<img>` tags should have `loading="lazy"`.

### Data stability

`hoses.json` and `rows.json` are derived from the Gates PDF and should be
treated as static assets — regenerated only when the source PDF changes.
Do not modify them by hand.

The `catalogPage` field in each hose record is the 1-indexed PDF page number.
Image filenames use that number zero-padded to 3 digits:
`page-${String(catalogPage).padStart(3,"0")}.jpg`.

### GitHub Pages deployment

- All paths are relative — no `/hosefinder/` base path required if the
  repo is served from the root.
- If deploying to a subdirectory (e.g. `username.github.io/hosefinder`),
  add a `homepage` field to `package.json` and set `<base href="/hosefinder/">`
  in the HTML.
- Add a `.nojekyll` file to the repo root to prevent GitHub Pages from
  ignoring files starting with `_` (relevant for some build outputs).
- The `images/` directory is large (~11MB catalog pages, ~50MB hose images
  after Phase 2). This is within GitHub's limits but will make initial
  clone slow. Consider `.gitattributes` LFS for the image directories.

---

## Backlog (future consideration)

These are real ideas worth tracking, but not prioritized for the current phases.

- **OEM cross-reference database** — map common OEM part numbers to Gates
  equivalents. Would require a separate data source (not in the Gates PDF).
- ~~**Inch / millimetre toggle**~~ — ✅ shipped. `unitMode` state persisted to
  localStorage, toggle in top bar, canonical inches internally, `<Dim>`/`fmtDim`
  convert at render time. Dimension inputs, tolerance badges, gap explainer,
  filter pills, compare modal, print sheet all unit-aware.
- ~~**URL-based deep linking**~~ — ✅ already shipped. Filter state round-trips
  via `URLSearchParams` on mount; `history.replaceState` keeps URL in sync;
  `shareCurrentSearch` copies current URL to clipboard.
- ~~**Progressive Web App**~~ — ✅ shipped. `public/manifest.webmanifest` with
  SVG icon + maskable variant. `public/sw.js` registered in production
  (`src/main.jsx`): stale-while-revalidate for app shell + data JSON,
  cache-first for catalog/hose images. Installable on Chrome/Edge/iOS.
- **User-contributed fitments** — a mechanism to annotate parts with real-world
  fitment data (e.g. "fits 1967 Camaro SBC 327 upper"). Would require a backend.
- **Gates API integration** — if Gates exposes a product API, replace the
  static JSON with live data including stock levels and pricing.

---

*Last updated: April 2026 — reflects current state of `CoolantHoseFinder.jsx`,
`data/hoses.json`, and `images/catalog/`.*
