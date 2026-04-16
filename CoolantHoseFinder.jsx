import React, { useMemo, useState, useEffect, useCallback } from "react";
import { editDistance } from "./src/lib/strings.js";
import { scoreAndFilter } from "./src/lib/filter.js";
import { ToastViewport } from "./src/components/ToastViewport.jsx";
import { KeyboardHelp } from "./src/components/KeyboardHelp.jsx";
import { CatalogFooter } from "./src/components/CatalogFooter.jsx";
import { UnitContext, useUnit } from "./src/context/unit.jsx";
import { RecentlyViewedStrip } from "./src/components/RecentlyViewedStrip.jsx";
import { PresetsStrip } from "./src/components/PresetsStrip.jsx";
import { LocaleContext, useLocale, createTranslator, LOCALES } from "./src/context/i18n.jsx";
import { TopBar } from "./src/components/TopBar.jsx";
import { Hero } from "./src/components/Hero.jsx";
import { QuickShapeStrip } from "./src/components/QuickShapeStrip.jsx";
import { ResultsHeader } from "./src/components/ResultsHeader.jsx";
import { ResultsArea } from "./src/components/ResultsArea.jsx";
import { RefineDisclosure } from "./src/components/RefineDisclosure.jsx";
import { WizardSection } from "./src/components/WizardSection.jsx";
import { TrailingDialogs } from "./src/components/TrailingDialogs.jsx";
import { FloatingBars } from "./src/components/FloatingBars.jsx";
import { PreResultsStrips } from "./src/components/PreResultsStrips.jsx";
import { ProjectBomRoute } from "./src/components/ProjectBomRoute.jsx";
import { MeasurementGuideDialog } from "./src/components/MeasurementGuideDialog.jsx";
import { FilterPanelContent } from "./src/components/FilterPanelContent.jsx";
import { useCatalogData } from "./src/hooks/useCatalogData.js";
import { useToasts } from "./src/hooks/useToasts.js";
import { useProjectRoute } from "./src/hooks/useProjectRoute.js";
import { useRecentlyViewed } from "./src/hooks/useRecentlyViewed.js";
import { useCompare } from "./src/hooks/useCompare.js";
import { useShareRoute } from "./src/hooks/useShareRoute.js";
import { usePairing } from "./src/hooks/usePairing.js";
import { useProjects } from "./src/hooks/useProjects.js";
import { useFilters } from "./src/hooks/useFilters.js";
import { useSavedSearches } from "./src/hooks/useSavedSearches.js";
import { useMediaQuery } from "./src/hooks/useMediaQuery.js";
import { useKeyboardShortcuts } from "./src/hooks/useKeyboardShortcuts.js";
import { PRESETS } from "./src/lib/presets.js";
import { printShortlist as printShortlistCmd } from "./src/lib/printShortlist.js";
import {
  flowSummary as buildFlowSummary,
  sizeSummary as buildSizeSummary, lengthSummary as buildLengthSummary,
} from "./src/lib/wizardSummaries.js";
import {
  Ruler, Bookmark,
  Sparkles, ArrowRight,
  Filter, Link2, Keyboard,
} from "lucide-react";
import { AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

// ─── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 24;
const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";
const SAVED_SEARCHES_KEY = "hosefinder-saved-searches";
const SAVED_SEARCHES_LIMIT = 12;
const UNIT_KEY = "hosefinder-unit";
const LOCALE_KEY = "hosefinder-locale";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoolantHoseFinder() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { allHoses, allRows, loading, catalogMeta } = useCatalogData();

  // ── Filter state lives in useFilters (see ./src/hooks/useFilters.js)
  const [unitMode,      setUnitMode]      = useState(/** @type {"in"|"mm"} */ (() => {
    if (typeof window === "undefined") return "in";
    try {
      const stored = window.localStorage.getItem(UNIT_KEY);
      if (stored === "in" || stored === "mm") return stored;
    } catch {}
    return "in";
  }));
  useEffect(() => {
    try { window.localStorage.setItem(UNIT_KEY, unitMode); } catch {}
  }, [unitMode]);
  const [locale, setLocale] = useState(/** @type {"en"|"es"} */ (() => {
    if (typeof window === "undefined") return "en";
    try {
      const stored = window.localStorage.getItem(LOCALE_KEY);
      if (LOCALES[stored]) return stored;
    } catch {}
    return "en";
  }));
  useEffect(() => {
    try { window.localStorage.setItem(LOCALE_KEY, locale); } catch {}
  }, [locale]);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [page,          setPage]          = useState(1);
  const [step,          setStep]          = useState(/** @type {number | "results"} */ (1));

  // Toasts — declared early so callbacks defined below can close over pushToast.
  const { toasts, pushToast } = useToasts();

  const onHydrateMeaningful = useCallback(() => setStep("results"), []);
  const {
    targetId1, setTargetId1,
    targetId2, setTargetId2,
    targetLen, setTargetLen,
    idTol, setIdTol,
    lenTol, setLenTol,
    hoseTypeFilter, setHoseTypeFilter,
    sizeBandFilter, setSizeBandFilter,
    endCountFilter, setEndCountFilter,
    flow, setFlow,
    search, setSearch,
    sortMode, setSortMode,
    viewMode, setViewMode,
    showRefine, setShowRefine,
    shapeMode, setShapeMode,
    selectedRows, setSelectedRows,
    silhouettes, setSilhouettes,
    curvature, setCurvature,
    lengthClass, setLengthClass,
    stepRatio, setStepRatio,
    dTargetId1, dTargetId2, dTargetLen, dSearch,
    hasActiveFilters, hasManualInputs,
    clearAllFilters, applyPresetFilters,
    captureSearchParams,
    filterParams,
  } = useFilters({ onHydrateMeaningful });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selected,  setSelected]  = useState(null);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [photoMeasureOpen, setPhotoMeasureOpen] = useState(false);
  const [bendBuilderOpen, setBendBuilderOpen] = useState(false);
  const [wirePhotoOpen, setWirePhotoOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Mobile: compare bar + shortlist bar overlap when both expanded. Enforce one at a time.
  const closeShortlistOnMobile = useCallback(() => setShortlistOpen(false), []);
  const {
    compare, setCompare,
    compareOpen, openCompareExclusive,
    compareModalOpen, setCompareModalOpen,
    toggleCompare, compared,
  } = useCompare({ allHoses, isMobile, onOpenWhileMobile: closeShortlistOnMobile });

  const openShortlistExclusive = useCallback((updater) => {
    setShortlistOpen((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next && isMobile) openCompareExclusive(false);
      return next;
    });
  }, [isMobile, openCompareExclusive]);

  const openShortlistOnAdd = useCallback(() => openShortlistExclusive(true), [openShortlistExclusive]);
  const {
    projects, activeProjectId, activeProject, shortlist,
    setActiveProjectId,
    shortlistWarning,
    updateProjectNote, updateProjectRole, dismissMissingBanner,
    clearProjectNotes, removeFromProject,
    toggleShortlist, clearShortlist,
    createProject, renameProject, duplicateProject, deleteProject,
    addImportedProject,
  } = useProjects({ pushToast, onShortlistAdded: openShortlistOnAdd });

  const applyPhotoMeasurement = useCallback((field, inches) => {
    if (field === "id1") setTargetId1(inches);
    else if (field === "id2") setTargetId2(inches);
    else if (field === "len") setTargetLen(inches);
    pushToast(`Applied ${inches}" to ${field === "id1" ? "End 1" : field === "id2" ? "End 2" : "Length"}`, { icon: Ruler });
  }, [pushToast]);

  const { viewProjectId, openProjectBom, closeProjectBom } = useProjectRoute({
    onOpen: () => setProjectManagerOpen(false),
  });

  const { sharePayload, closeShareImport, shareProjectUrl, importSharedProject } =
    useShareRoute({ projects, addImportedProject, pushToast });

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const results = allHoses
      .map(h => scoreAndFilter(h, filterParams))
      .filter(Boolean)
      .filter((h) => selectedRows.size === 0 || selectedRows.has(h.rowNo));

    results.sort((a, b) => {
      if (sortMode === "score") return b._score - a._score;
      if (sortMode === "id")    return (a.idMin || 0) - (b.idMin || 0);
      if (sortMode === "len")   return a.length - b.length;
      if (sortMode === "part")  return a.partNo.localeCompare(b.partNo);
      return 0;
    });
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHoses, dTargetId1, dTargetId2, dTargetLen, idTol[0], lenTol[0], hoseTypeFilter, sizeBandFilter, endCountFilter, flow, dSearch, sortMode, selectedRows, silhouettes, curvature, lengthClass, stepRatio]);

  // "Did you mean…" — fires only when the search looks like a partial part
  // number (≥4 digits, no non-digit chars) and produced zero results. Helps
  // thumb-typo recovery without polluting normal queries.
  const fuzzyPartSuggestions = useMemo(() => {
    if (filtered.length > 0) return [];
    const q = (dSearch || "").trim();
    if (!/^\d{4,}$/.test(q)) return [];
    const scored = [];
    for (const h of allHoses) {
      if (h.partNo === q) return [];
      const d = editDistance(q, h.partNo, 3);
      if (d <= 2) scored.push({ hose: h, d });
    }
    scored.sort((a, b) => a.d - b.d || (a.hose.catalogPage || 0) - (b.hose.catalogPage || 0));
    return scored.slice(0, 3).map((s) => s.hose);
  }, [filtered.length, dSearch, allHoses]);

  // Candidates for curvature chips — apply every filter EXCEPT curvature so
  // the per-group counts reflect "how many would match if I added this chip."
  const curvatureCandidates = useMemo(() => {
    const params = { ...filterParams, curvature: new Set() };
    return allHoses
      .map(h => scoreAndFilter(h, params))
      .filter(Boolean)
      .filter(h => selectedRows.size === 0 || selectedRows.has(h.rowNo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHoses, dTargetId1, dTargetId2, dTargetLen, idTol[0], lenTol[0], hoseTypeFilter, sizeBandFilter, endCountFilter, flow, dSearch, selectedRows, lengthClass]);

  const lengthClassCandidates = useMemo(() => {
    const params = { ...filterParams, lengthClass: new Set() };
    return allHoses
      .map(h => scoreAndFilter(h, params))
      .filter(Boolean)
      .filter(h => selectedRows.size === 0 || selectedRows.has(h.rowNo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHoses, dTargetId1, dTargetId2, dTargetLen, idTol[0], lenTol[0], hoseTypeFilter, sizeBandFilter, endCountFilter, flow, dSearch, selectedRows, curvature, stepRatio]);

  const stepRatioCandidates = useMemo(() => {
    const params = { ...filterParams, stepRatio: new Set() };
    return allHoses
      .map(h => scoreAndFilter(h, params))
      .filter(Boolean)
      .filter(h => selectedRows.size === 0 || selectedRows.has(h.rowNo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHoses, dTargetId1, dTargetId2, dTargetLen, idTol[0], lenTol[0], hoseTypeFilter, sizeBandFilter, endCountFilter, flow, dSearch, selectedRows, curvature, lengthClass]);

  const liveDiameterMatches = useMemo(() => {
    if (dTargetId1 === "" && dTargetId2 === "") return 0;
    return allHoses
      .map((h) => scoreAndFilter(h, {
        ...filterParams,
        targetLen: "",
        lenTol: 99,
      }))
      .filter(Boolean)
      .length;
  }, [allHoses, filterParams, dTargetId1, dTargetId2]);

  const liveLengthMatches = useMemo(() => {
    if (dTargetLen === "") return 0;
    return allHoses
      .map((h) => scoreAndFilter(h, {
        ...filterParams,
        targetLen: dTargetLen,
      }))
      .filter(Boolean)
      .length;
  }, [allHoses, filterParams, dTargetLen]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore   = paginated.length < filtered.length;

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filtered]);

  const { recentHoses } = useRecentlyViewed({
    selectedPartNo: selected?.partNo,
    allHoses,
  });

  const shortlisted = useMemo(
    () => allHoses.filter((h) => shortlist.has(h.partNo)),
    [allHoses, shortlist],
  );
  const rowCounts = useMemo(() => allHoses.reduce((acc, hose) => {
    acc[hose.rowNo] = (acc[hose.rowNo] || 0) + 1;
    return acc;
  }, {}), [allHoses]);
  const rowMetaByNo = useMemo(() => Object.fromEntries(allRows.map((row) => [row.rowNo, row])), [allRows]);
  const pageMap = useMemo(() => {
    const pages = {};
    allRows.forEach((row) => {
      const page = row.catalogPage;
      if (!pages[page]) pages[page] = { page, rows: [], count: 0, firstRow: row.rowNo, lastRow: row.rowNo, familyLabels: [] };
      pages[page].rows.push(row.rowNo);
      pages[page].count += row.count;
      pages[page].firstRow = Math.min(pages[page].firstRow, row.rowNo);
      pages[page].lastRow = Math.max(pages[page].lastRow, row.rowNo);
      (row.familyLabels || [row.familyLabel]).forEach((label) => {
        if (label && !pages[page].familyLabels.includes(label) && pages[page].familyLabels.length < 2) {
          pages[page].familyLabels.push(label);
        }
      });
    });
    return Object.values(pages).sort((a, b) => a.page - b.page);
  }, [allRows]);

  // ── Suggestions for detail modal ──────────────────────────────────────────
  const suggestions = useMemo(() => {
    if (!selected) return [];
    return allHoses
      .filter(h => h.partNo !== selected.partNo && h.hoseType === selected.hoseType)
      .map(h => {
        let score = 0;
        if (h.sizeBand === selected.sizeBand) score += 4;
        if (h.rowNo === selected.rowNo) score += 3;
        if (h.endCount === selected.endCount) score += 2;
        const sharedEnds = h.endSizes.filter(s => selected.endSizes.some(t => Math.abs(s - t) < 0.1)).length;
        score += sharedEnds * 2;
        score -= Math.abs(h.length - selected.length) / 5;
        return { ...h, _sugg: score };
      })
      .sort((a, b) => b._sugg - a._sugg)
      .slice(0, 4);
  }, [selected, allHoses]);

  const { disablePairing, pairSuggestions } = usePairing({
    projects, selected, allHoses,
    targetId: dTargetId1, idTolerance: idTol[0],
  });

  // ── Visual families for dropdowns ─────────────────────────────────────────
  const sizeBands = useMemo(() => ["all", ...new Set(allHoses.map(h => h.sizeBand))], [allHoses]);

  // Flow cards live in ./src/lib/wizardSummaries.js; FlowCards component
  // renders them directly.

  // ── Exact / close counts ──────────────────────────────────────────────────
  const exactCount = filtered.filter(h => h._matchQuality === "exact").length;
  const closeCount = filtered.filter(h => h._matchQuality === "close").length;
  const needsSecondDiameter = flow === "reducer" || flow === "branched";
  const hasRequiredDimensions = targetId1 !== "" && (!needsSecondDiameter || targetId2 !== "");
  const canShowResults = targetId1 !== "" || targetId2 !== "" || targetLen !== "" || selectedRows.size > 0;

  useEffect(() => {
    if (showPresets && hasManualInputs) setShowPresets(false);
  }, [showPresets, hasManualInputs]);

  const resetSearch = useCallback(() => {
    clearAllFilters();
    setStep(1);
  }, [clearAllFilters]);

  const applyPreset = useCallback((preset) => {
    if (hasManualInputs) {
      const ok = window.confirm("Apply this preset and replace your current filters?");
      if (!ok) return;
    }
    applyPresetFilters(preset);
    setStep("results");
    setShowPresets(false);
    pushToast(`Loaded preset “${preset.label}”`, { icon: Sparkles });
  }, [hasManualInputs, applyPresetFilters, pushToast]);

  const printShortlist = useCallback(() => {
    const result = printShortlistCmd(shortlisted, unitMode);
    if (result === "popup-blocked") {
      pushToast("Popup blocked. Allow popups to print the shortlist.", { tone: "warning" });
    }
  }, [shortlisted, unitMode, pushToast]);

  const showRow = useCallback((rowNo) => {
    setSelectedRows(new Set([rowNo]));
    setShapeMode(false);
    setPage(1);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  useKeyboardShortcuts({
    focusSearch: useCallback(() => {
      setShowRefine(true);
      requestAnimationFrame(() => {
        const el = document.getElementById("part-search-input");
        el?.focus();
        el?.select?.();
      });
    }, []),
    toggleShortlist: useCallback(() => openShortlistExclusive((o) => !o), [openShortlistExclusive]),
    toggleCompare:   useCallback(() => openCompareExclusive((o) => !o), [openCompareExclusive]),
    setViewMode,
    scrollToTop:     useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []),
    showHelp:        useCallback(() => setKeyboardHelpOpen(true), []),
  });

  // ── Saved searches ────────────────────────────────────────────────────────
  const { savedSearches, saveSearch, removeSearch: removeSavedSearch } = useSavedSearches({ pushToast });

  const saveCurrentSearch = useCallback(() => {
    if (!hasActiveFilters) return;
    const name = window.prompt("Name this search", "")?.trim();
    if (!name) return;
    saveSearch(name, captureSearchParams());
  }, [hasActiveFilters, captureSearchParams, saveSearch]);

  const shareCurrentSearch = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      pushToast("Link copied — paste anywhere", { icon: Link2 });
    } catch {
      pushToast("Couldn't copy — copy the URL bar manually", { tone: "warning" });
    }
  }, [pushToast]);

  const applySavedSearch = useCallback((s) => {
    const p = s.params || {};
    setFlow(p.flow || "all");
    setTargetId1(p.targetId1 || "");
    setTargetId2(p.targetId2 || "");
    setTargetLen(p.targetLen || "");
    setIdTol([typeof p.idTol === "number" ? p.idTol : 0.06]);
    setLenTol([typeof p.lenTol === "number" ? p.lenTol : 2.0]);
    setSearch(p.search || "");
    setSizeBandFilter(p.sizeBandFilter || "all");
    setEndCountFilter(p.endCountFilter || "all");
    setSortMode(p.sortMode || "score");
    setCurvature(new Set(p.curvature || []));
    setLengthClass(new Set(p.lengthClass || []));
    setStepRatio(new Set(p.stepRatio || []));
    setSilhouettes(new Set(p.silhouettes || []));
    setSelectedRows(new Set(p.selectedRows || []));
    setStep("results");
    setShapeMode(false);
    setTimeout(() => window.scrollTo({ top: 240, behavior: "smooth" }), 50);
    pushToast(`Loaded “${s.name}”`, { icon: Bookmark });
  }, [pushToast, setFlow, setTargetId1, setTargetId2, setTargetLen, setIdTol, setLenTol, setSearch, setSizeBandFilter, setEndCountFilter, setSortMode, setCurvature, setLengthClass, setStepRatio, setSilhouettes, setSelectedRows, setShapeMode]);

  // Open the similar-shape sheet: a ranked, explainable view of hoses with
  // the same silhouette/curvature/step-ratio/length-class as the given one.
  const [similarForHose, setSimilarForHose] = useState(null);
  const findSimilar = useCallback((hose) => {
    setSelected(null);
    setSimilarForHose(hose);
  }, []);

  const toggleShapePage = useCallback((rows) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      const allSelected = rows.every((rowNo) => next.has(rowNo));
      rows.forEach((rowNo) => {
        if (allSelected) next.delete(rowNo);
        else next.add(rowNo);
      });
      return next;
    });
  }, []);

  const clearIdFilters = useCallback(() => {
    setTargetId1("");
    setTargetId2("");
  }, []);

  const clearLengthFilter = useCallback(() => {
    setTargetLen("");
    setLenTol([2.0]);
  }, []);

  const clearFlowFilter = useCallback(() => {
    setFlow("all");
    setStep(1);
  }, []);

  const clearRowFilters = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const flowSummary   = useMemo(() => buildFlowSummary(flow), [flow]);
  const sizeSummary   = useMemo(() => buildSizeSummary(targetId1, targetId2), [targetId1, targetId2]);
  const lengthSummary = useMemo(() => buildLengthSummary(targetLen, lenTol[0]), [targetLen, lenTol]);

  useEffect(() => {
    if (flow !== "all" && step === 1) setStep(2);
  }, [flow, step]);

  // When the hash route resolves to #/project/:id, take over the whole
  // page with the BOM editor — skip the wizard/results surface entirely.
  if (viewProjectId) {
    return (
      <ProjectBomRoute
        viewing={projects.find((p) => p.id === viewProjectId)}
        unitMode={unitMode}
        allHoses={allHoses}
        toasts={toasts}
        onBack={closeProjectBom}
        onRename={renameProject}
        onRemoveHose={(partNo) => removeFromProject(viewProjectId, partNo)}
        onUpdateNote={(partNo, text) => updateProjectNote(viewProjectId, partNo, text)}
        onUpdateRole={(partNo, role) => updateProjectRole(viewProjectId, partNo, role)}
        onDismissBanner={() => dismissMissingBanner(viewProjectId)}
        onClearNotes={() => clearProjectNotes(viewProjectId)}
        onShare={() => shareProjectUrl(viewProjectId)}
        sharePayload={sharePayload}
        onImportShare={importSharedProject}
        onCloseShareImport={closeShareImport}
      />
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, t }}>
    <UnitContext.Provider value={unitMode}>
    {/* `dark` forces shadcn CSS variables into dark-mode values regardless of the page theme. */}
    <div className="dark" style={{ colorScheme: "dark" }}>
    <div className="app-surface min-h-screen text-zinc-100">
      <a
        href="#results-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-violet-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        {t("common.skipToResults")}
      </a>
      <div className="grain" aria-hidden />
      <TopBar
        total={allHoses.length}
        filtered={filtered.length}
        hasFilters={hasActiveFilters}
        shortlistCount={shortlist.size}
        onShowShortlist={() => openShortlistExclusive(true)}
        unitMode={unitMode}
        setUnitMode={setUnitMode}
        locale={locale}
        setLocale={setLocale}
      />
      <ToastViewport toasts={toasts} />
      <KeyboardHelp open={keyboardHelpOpen} onClose={() => setKeyboardHelpOpen(false)} />
      <main id="results-main" className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8 pb-32">

        {/* ── Hero ── */}
        <Hero
          t={t}
          totalHoses={allHoses.length}
          filteredCount={filtered.length}
          hasActiveFilters={hasActiveFilters}
          allHoses={allHoses}
          onSelectHose={setSelected}
          onStart={() => {
            setShapeMode(false);
            setStep(flow === "all" ? 1 : step);
          }}
          onToggleShape={() => setShapeMode((prev) => !prev)}
          onShowGuide={() => setShowGuide(true)}
          onShowShortcuts={() => setKeyboardHelpOpen(true)}
        />

        {showPresets ? (
          <PresetsStrip
            presets={PRESETS}
            onApply={applyPreset}
            onDismiss={() => setShowPresets(false)}
          />
        ) : (
          <div className="mt-6 flex justify-start">
            <button
              type="button"
              onClick={() => setShowPresets(true)}
              className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-zinc-300 transition hover:border-violet-400/30 hover:bg-white/[0.06] hover:text-white"
            >
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_12px_-2px_rgba(139,92,246,0.55)]`}>
                <Sparkles className="h-3 w-3" />
              </span>
              Start from a preset
              <ArrowRight className="h-3 w-3 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
            </button>
          </div>
        )}

        {/* ── Quick shape strip — "wire method" ── */}
        {step === 1 && !shapeMode && (
          <QuickShapeStrip
            candidates={curvatureCandidates}
            curvature={curvature}
            setCurvature={setCurvature}
            flow={flow}
            setFlow={setFlow}
            onOpenBendBuilder={() => setBendBuilderOpen(true)}
            onOpenWirePhoto={() => setWirePhotoOpen(true)}
          />
        )}

        {/* ── Wizard section: eyebrow + step chain + optional shape browser ── */}
        <WizardSection
          t={t}
          step={step} setStep={setStep}
          flow={flow} setFlow={setFlow} flowSummary={flowSummary}
          targetId1={targetId1} setTargetId1={setTargetId1}
          targetId2={targetId2} setTargetId2={setTargetId2}
          targetLen={targetLen} setTargetLen={setTargetLen}
          needsSecondDiameter={needsSecondDiameter}
          hasRequiredDimensions={hasRequiredDimensions}
          liveDiameterMatches={liveDiameterMatches}
          liveLengthMatches={liveLengthMatches}
          lenTol={lenTol} setLenTol={setLenTol}
          sizeSummary={sizeSummary} lengthSummary={lengthSummary}
          unitMode={unitMode} allHoses={allHoses}
          allRows={allRows} pageMap={pageMap}
          selectedRows={selectedRows} silhouettes={silhouettes}
          setSilhouettes={setSilhouettes}
          setSelectedRows={setSelectedRows}
          toggleShapePage={toggleShapePage}
          shapeMode={shapeMode} setShapeMode={setShapeMode}
          filteredCount={filtered.length}
        />

        {/* ── Refine disclosure — one progressive-depth surface for every viewport ── */}
        <RefineDisclosure
          open={showRefine}
          onToggle={() => setShowRefine((prev) => !prev)}
          hasActiveFilters={hasActiveFilters}
          label={t("refine.label")}
          subtitle={t("refine.subtitle")}
        >
          <FilterPanelContent
            search={search} setSearch={setSearch}
            targetId1={targetId1} setTargetId1={setTargetId1}
            targetId2={targetId2} setTargetId2={setTargetId2}
            targetLen={targetLen} setTargetLen={setTargetLen}
            liveDiameterMatches={liveDiameterMatches}
            liveLengthMatches={liveLengthMatches}
            showAdvancedFilters={showAdvancedFilters}
            setShowAdvancedFilters={setShowAdvancedFilters}
            idTol={idTol} setIdTol={setIdTol}
            lenTol={lenTol} setLenTol={setLenTol}
            sizeBandFilter={sizeBandFilter} setSizeBandFilter={setSizeBandFilter}
            endCountFilter={endCountFilter} setEndCountFilter={setEndCountFilter}
            clearAllFilters={resetSearch}
            onOpenPhotoMeasure={() => setPhotoMeasureOpen(true)}
            allHoses={allHoses}
          />
        </RefineDisclosure>

        {/* ── Results ── */}
        <div className="mt-6">
            {!loading && !hasActiveFilters && recentHoses.length > 0 && (
              <RecentlyViewedStrip hoses={recentHoses} onSelect={setSelected} />
            )}
            {/* Pre-results strips + ActiveFilterStrip */}
            <PreResultsStrips
              canShowResults={canShowResults}
              loading={loading}
              hasActiveFilters={hasActiveFilters}
              flow={flow}
              savedSearches={savedSearches}
              applySavedSearch={applySavedSearch}
              removeSavedSearch={removeSavedSearch}
              saveCurrentSearch={saveCurrentSearch}
              shareCurrentSearch={shareCurrentSearch}
              lengthClassCandidates={lengthClassCandidates}
              curvatureCandidates={curvatureCandidates}
              stepRatioCandidates={stepRatioCandidates}
              lengthClass={lengthClass} setLengthClass={setLengthClass}
              curvature={curvature} setCurvature={setCurvature}
              stepRatio={stepRatio} setStepRatio={setStepRatio}
              targetId1={targetId1} targetId2={targetId2} targetLen={targetLen}
              idTol={idTol[0]} lenTol={lenTol[0]}
              selectedRows={selectedRows} rowMetaByNo={rowMetaByNo}
              filteredCount={filtered.length}
              onClearId={clearIdFilters}
              onClearLen={clearLengthFilter}
              onClearType={clearFlowFilter}
              onClearRows={clearRowFilters}
            />
            <ResultsHeader
              loading={loading}
              canShowResults={canShowResults}
              hasActiveFilters={hasActiveFilters}
              filteredCount={filtered.length}
              exactCount={exactCount}
              closeCount={closeCount}
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortMode={sortMode}
              setSortMode={setSortMode}
            />

            {/* Cards */}
            <ResultsArea
              loading={loading}
              canShowResults={canShowResults}
              filtered={filtered}
              paginated={paginated}
              hasMore={hasMore}
              fuzzyPartSuggestions={fuzzyPartSuggestions}
              viewMode={viewMode}
              dTargetId1={dTargetId1}
              dTargetId2={dTargetId2}
              dTargetLen={dTargetLen}
              allHoses={allHoses}
              shortlist={shortlist}
              toggleShortlist={toggleShortlist}
              rowCounts={rowCounts}
              onSelect={setSelected}
              onLoadMore={() => setPage((p) => p + 1)}
              onSearchByPart={(partNo) => setSearch(partNo)}
              onBrowseShapes={() => setShapeMode(true)}
              onApplyTolerances={({ idTol: newIdTol, lenTol: newLenTol }) => {
                setIdTol([newIdTol]);
                setLenTol([newLenTol]);
              }}
              onShowRow={showRow}
              onFindSimilar={findSimilar}
              onClearLength={clearLengthFilter}
              onClearId={clearIdFilters}
              onShowGuide={() => setShowGuide(true)}
            />
        </div>
      </main>

      {/* ── Floating bars: compare + shortlist ── */}
      <FloatingBars
        compare={{
          compared,
          toggleCompare,
          clearCompare: () => setCompare([]),
          open: compareOpen,
          onToggleOpen: () => openCompareExclusive((prev) => !prev),
          onOpenCompareView: () => setCompareModalOpen(true),
        }}
        shortlist={{
          shortlisted,
          warning: shortlistWarning,
          open: shortlistOpen,
          onToggleOpen: () => openShortlistExclusive((prev) => !prev),
          onSelect: (hose) => {
            setSelected(hose);
            setShortlistOpen(false);
          },
          onToggleShortlist: toggleShortlist,
          onPrint: printShortlist,
          onClear: clearShortlist,
          projectName: activeProject?.name,
          projectCount: projects.length,
          onOpenProjects: () => setProjectManagerOpen(true),
          onOpenBom: activeProject ? () => openProjectBom(activeProject.id) : undefined,
        }}
      />

      <TrailingDialogs
        allHoses={allHoses}
        onSelect={setSelected}
        projectManager={{
          open: projectManagerOpen,
          onClose: () => setProjectManagerOpen(false),
          projects,
          activeId: activeProjectId,
          onSwitch: setActiveProjectId,
          onRename: renameProject,
          onCreate: createProject,
          onDuplicate: duplicateProject,
          onDelete: deleteProject,
          onOpenBom: openProjectBom,
        }}
        shareImport={{
          payload: sharePayload,
          onImport: importSharedProject,
          onClose: closeShareImport,
        }}
        similarShape={{
          target: similarForHose,
          onClose: () => setSimilarForHose(null),
        }}
        photoMeasure={{
          open: photoMeasureOpen,
          onClose: () => setPhotoMeasureOpen(false),
          onApply: applyPhotoMeasurement,
        }}
        bendBuilder={{
          open: bendBuilderOpen,
          onClose: () => setBendBuilderOpen(false),
        }}
        wirePhoto={{
          open: wirePhotoOpen,
          onClose: () => setWirePhotoOpen(false),
        }}
        compareModal={{
          open: compareModalOpen,
          onClose: () => setCompareModalOpen(false),
          hoses: compared,
          onRemove: (partNo) => {
            toggleCompare(partNo);
            if (compared.length <= 1) setCompareModalOpen(false);
          },
        }}
        detailModal={{
          hose: selected,
          onClose: () => setSelected(null),
          suggestions,
          onShowRow: showRow,
          onFindSimilar: findSimilar,
          rowCount: selected ? rowCounts[selected.rowNo] : 0,
          rowMeta: selected ? rowMetaByNo[selected.rowNo] : null,
          shortlist,
          toggleShortlist,
          compare,
          toggleCompare,
          pairSuggestions,
          onDisablePairing: disablePairing,
        }}
      />

      <MeasurementGuideDialog
        open={showGuide}
        onOpenChange={setShowGuide}
        t={t}
      />

      <CatalogFooter meta={catalogMeta} />
    </div>
    </div>
    </UnitContext.Provider>
    </LocaleContext.Provider>
  );
}

// CatalogFooter moved to ./src/components/CatalogFooter.jsx

// SAMPLE_HOSES moved to ./src/lib/sampleHoses.js
