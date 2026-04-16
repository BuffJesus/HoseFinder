import React, { useMemo, useState, useEffect, useCallback } from "react";
import { parseNaturalSize, fractionSuggestionsFor, COMMON_FRACTIONS } from "./src/lib/naturalSize.js";
import { editDistance } from "./src/lib/strings.js";
import {
  ROLES, ROLE_LABEL, CANONICAL_ROLES_FOR_COMPLETE_BUILD,
  roleKey, roleDisplay,
} from "./src/lib/roles.js";
import {
  STEP_RATIOS, LENGTH_CLASSES, LENGTH_CLASS_BY_KEY,
  CURVATURE_GROUPS, CURVATURE_BY_SIL, reducerStepRatio,
} from "./src/lib/shapeBuckets.js";
import { shapeSimilarity, findSimilarHoses } from "./src/lib/similarity.js";
import { scoreAndFilter } from "./src/lib/filter.js";
import { MatchBadge, CountPill, Kbd, MmHint, Viewer360Icon } from "./src/components/primitives.jsx";
import { HoseSilhouette, MorphingHoseSilhouette, SILHOUETTE_FAMILIES } from "./src/components/HoseSilhouette.jsx";
import { ToastViewport } from "./src/components/ToastViewport.jsx";
import { KeyboardHelp } from "./src/components/KeyboardHelp.jsx";
import { AnimatedCount } from "./src/components/AnimatedCount.jsx";
import { HeroLiveCount } from "./src/components/HeroLiveCount.jsx";
import { CatalogFooter } from "./src/components/CatalogFooter.jsx";
import { UnitToggle, LocaleToggle } from "./src/components/toggles.jsx";
import { MeasurementHint } from "./src/components/MeasurementHint.jsx";
import { UnitContext, useUnit, Dim } from "./src/context/unit.jsx";
import { BottomSheet } from "./src/components/BottomSheet.jsx";
import { CommonSizesPicker } from "./src/components/CommonSizesPicker.jsx";
import { GapExplainer } from "./src/components/GapExplainer.jsx";
import { SavedSearchesStrip } from "./src/components/SavedSearchesStrip.jsx";
import { RecentlyViewedStrip } from "./src/components/RecentlyViewedStrip.jsx";
import { ActiveFilterStrip } from "./src/components/ActiveFilterStrip.jsx";
import { HoseImage, ImageTile, hoseImgSrc, catalogImgSrc } from "./src/components/HoseImage.jsx";
import { ShortlistButton } from "./src/components/ShortlistButton.jsx";
import { PresetIcon, PresetsStrip } from "./src/components/PresetsStrip.jsx";
import { WizardStepCard, WizardSummaryStrip } from "./src/components/wizard-cards.jsx";
import { NaturalDimInput } from "./src/components/NaturalDimInput.jsx";
import { pushMeasurementHistory } from "./src/lib/measurementHistory.js";
import { SmartEmptyState } from "./src/components/SmartEmptyState.jsx";
import { StepRatioChips, LengthClassChips, CurvatureChips } from "./src/components/filter-chips.jsx";
import { HoseCard, HoseCardSkeleton } from "./src/components/HoseCard.jsx";
import { HoseListCard } from "./src/components/HoseListCard.jsx";
import { HoseCompactTable } from "./src/components/HoseCompactTable.jsx";
import { RoleSection } from "./src/components/RoleSection.jsx";
import { gatesUrl, gates360Url } from "./src/lib/gatesUrls.js";
import { LocaleContext, useLocale, createTranslator, LOCALES } from "./src/context/i18n.jsx";
import { TopBar } from "./src/components/TopBar.jsx";
import { MeasurementGuide } from "./src/components/MeasurementGuide.jsx";
import { CompareBar } from "./src/components/CompareBar.jsx";
import { ShortlistBar } from "./src/components/ShortlistBar.jsx";
import { ShareImportDialog } from "./src/components/ShareImportDialog.jsx";
import { ProjectManager } from "./src/components/ProjectManager.jsx";
import { SimilarShapeSheet } from "./src/components/SimilarShapeSheet.jsx";
import { CompareModal } from "./src/components/CompareModal.jsx";
import { DetailModal } from "./src/components/DetailModal.jsx";
import { ProjectOverview } from "./src/components/ProjectOverview.jsx";
import { PhotoMeasureDialog } from "./src/components/PhotoMeasureDialog.jsx";
import { FilterPanelContent } from "./src/components/FilterPanelContent.jsx";
import {
  enrichHose, SIZE_BAND_LABELS, APPLICATION_LABELS, SHAPE_LABELS,
} from "./src/lib/enrichHose.js";
import { SAMPLE_HOSES } from "./src/lib/sampleHoses.js";
import { ShapeBrowser } from "./src/components/ShapeBrowser.jsx";
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
import { validPairingsFor } from "./src/lib/endPairings.js";
import {
  FLOW_CARDS, flowSummary as buildFlowSummary,
  sizeSummary as buildSizeSummary, lengthSummary as buildLengthSummary,
} from "./src/lib/wizardSummaries.js";
import {
  Search, GitCompare, Check, Info, X, ChevronRight,
  SlidersHorizontal, Ruler, Layers3, Loader2,
  ChevronDown, ArrowUpDown, BookOpen, Bookmark, Printer,
  SearchX, Sparkles, Wand, ArrowRight,
  LayoutGrid, List, Table2,
  Flame, Snowflake, GitFork, Shield, Filter,
  Save, Trash2, Link2, Keyboard, Clock, ExternalLink,
  Edit3, Copy, Plus, FolderOpen,
} from "lucide-react";

// Viewer360Icon, MatchBadge, CountPill, Kbd, MmHint moved to
// ./src/components/primitives.jsx — imported at top.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

// ─── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 24;
const ACCENT = "from-violet-500 via-fuchsia-500 to-purple-500";
// Roles / share codec live in ./src/lib/roles.js — imported above.
// Project state + persistence live in ./src/hooks/useProjects.js.

const SAVED_SEARCHES_KEY = "hosefinder-saved-searches";
const SAVED_SEARCHES_LIMIT = 12;

// gatesUrl + gates360Url moved to ./src/lib/gatesUrls.js

// UnitContext + useUnit + Dim moved to ./src/context/unit.jsx
const UNIT_KEY = "hosefinder-unit";

// Measurement history moved to ./src/lib/measurementHistory.js
// NaturalDimInput moved to ./src/components/NaturalDimInput.jsx

// LocaleContext, useLocale, createTranslator, LOCALES moved to ./src/context/i18n.jsx
const LOCALE_KEY = "hosefinder-locale";

// UnitToggle + LocaleToggle moved to ./src/components/toggles.jsx

// useMediaQuery moved to ./src/hooks/useMediaQuery.js
// BottomSheet moved to ./src/components/BottomSheet.jsx
// PRESETS moved to ./src/lib/presets.js

// Map sizeBand key → human label
// SIZE_BAND_LABELS moved to ./src/lib/enrichHose.js

// enrichHose + helpers moved to ./src/lib/enrichHose.js

// Shape buckets, reducerStepRatio, shapeSimilarity, findSimilarHoses live in
// ./src/lib/shapeBuckets.js + ./src/lib/similarity.js — imported at top.

// scoreAndFilter lives in ./src/lib/filter.js — imported at top.

// ─── SVG Silhouettes ─────────────────────────────────────────────────────────
// HoseSilhouette + MorphingHoseSilhouette + SILHOUETTE_FAMILIES moved to
// ./src/components/HoseSilhouette.jsx

// ─── Gap explainer ───────────────────────────────────────────────────────────
// GapExplainer moved to ./src/components/GapExplainer.jsx

// ─── Match badge ─────────────────────────────────────────────────────────────
// MatchBadge + MmHint moved to ./src/components/primitives.jsx

// CommonSizesPicker + COMMON_IDS moved to ./src/components/CommonSizesPicker.jsx

// ─── Keyboard kbd badge ─────────────────────────────────────────────────────
// Kbd moved to ./src/components/primitives.jsx

// KeyboardHelp moved to ./src/components/KeyboardHelp.jsx

// ToastViewport moved to ./src/components/ToastViewport.jsx

// SavedSearchesStrip moved to ./src/components/SavedSearchesStrip.jsx

// StepRatioChips + LengthClassChips + CurvatureChips moved to
// ./src/components/filter-chips.jsx

// ─── Wizard step card — glass surface with step indicator + accent hairline ─
// WizardStepCard moved to ./src/components/wizard-cards.jsx

// ─── Slim top bar — appears after the user scrolls past the hero ─────────────
// TopBar moved to ./src/components/TopBar.jsx

// ─── Loading skeleton — placeholder cards while catalog data loads ──────────
// HoseCardSkeleton moved to ./src/components/HoseCard.jsx

// AnimatedCount moved to ./src/components/AnimatedCount.jsx

// HeroLiveCount moved to ./src/components/HeroLiveCount.jsx

// IdMeasurementSVG + LengthMeasurementSVG + MeasurementHint moved to
// ./src/components/MeasurementHint.jsx

// HoseImage / ImageTile / catalogImgSrc / hoseImgSrc moved to ./src/components/HoseImage.jsx
// ShortlistButton moved to ./src/components/ShortlistButton.jsx
// PresetIcon + PresetsStrip moved to ./src/components/PresetsStrip.jsx


// RecentlyViewedStrip moved to ./src/components/RecentlyViewedStrip.jsx

// ─── BOM role section ────────────────────────────────────────────────────
// RoleSection moved to ./src/components/RoleSection.jsx

// ─── Project overview (BOM) ──────────────────────────────────────────────
// ProjectOverview moved to ./src/components/ProjectOverview.jsx

// PhotoMeasureDialog + PHOTO_REFERENCES + dist() moved to
// ./src/components/PhotoMeasureDialog.jsx

// ─── Similar-shape sheet ─────────────────────────────────────────────────
// SimilarShapeSheet moved to ./src/components/SimilarShapeSheet.jsx

// ─── Share import dialog ────────────────────────────────────────────────
// ShareImportDialog moved to ./src/components/ShareImportDialog.jsx

// ─── Project manager dialog ──────────────────────────────────────────────
// ProjectManager moved to ./src/components/ProjectManager.jsx

// CompareModal moved to ./src/components/CompareModal.jsx

// ─── HoseCard ─────────────────────────────────────────────────────────────────
// HoseCard moved to ./src/components/HoseCard.jsx

// HoseListCard moved to ./src/components/HoseListCard.jsx

// HoseCompactTable moved to ./src/components/HoseCompactTable.jsx

// ─── GlassStat ────────────────────────────────────────────────────────────────
// GlassStat was defined but unused — removed during extraction.

// ─── Measurement Guide ────────────────────────────────────────────────────────
// WizardSummaryStrip moved to ./src/components/wizard-cards.jsx

// ActiveFilterStrip moved to ./src/components/ActiveFilterStrip.jsx

// APPLICATIONS + ShapeBrowser moved to ./src/components/ShapeBrowser.jsx

// MeasurementGuide moved to ./src/components/MeasurementGuide.jsx

// ─── Compare Bar ─────────────────────────────────────────────────────────────
// CountPill moved to ./src/components/primitives.jsx

// CompareBar moved to ./src/components/CompareBar.jsx

// ShortlistBar moved to ./src/components/ShortlistBar.jsx

// ─── Detail Modal ─────────────────────────────────────────────────────────────
// DetailModal moved to ./src/components/DetailModal.jsx

// ─── Smart empty state ───────────────────────────────────────────────────────
// Relaxation paths — each is one targeted concession the user can opt into.
// Ordered so the most conservative path is tried first.
// RELAXATIONS, relaxedHits, relaxationHint, SmartEmptyState moved to
// ./src/components/SmartEmptyState.jsx

// ─── Filter panel (shared between desktop sidebar and mobile bottom sheet) ───
// FilterPanelContent moved to ./src/components/FilterPanelContent.jsx

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoolantHoseFinder() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { allHoses, allRows, loading, catalogMeta } = useCatalogData();

  // ── Filter state lives in useFilters (see ./src/hooks/useFilters.js)
  const [unitMode,      setUnitMode]      = useState(() => {
    if (typeof window === "undefined") return "in";
    try {
      const stored = window.localStorage.getItem(UNIT_KEY);
      if (stored === "in" || stored === "mm") return stored;
    } catch {}
    return "in";
  });
  useEffect(() => {
    try { window.localStorage.setItem(UNIT_KEY, unitMode); } catch {}
  }, [unitMode]);
  const [locale, setLocale] = useState(() => {
    if (typeof window === "undefined") return "en";
    try {
      const stored = window.localStorage.getItem(LOCALE_KEY);
      if (LOCALES[stored]) return stored;
    } catch {}
    return "en";
  });
  useEffect(() => {
    try { window.localStorage.setItem(LOCALE_KEY, locale); } catch {}
  }, [locale]);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [page,          setPage]          = useState(1);
  const [step,          setStep]          = useState(1);

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

  // Flow cards moved to ./src/lib/wizardSummaries.js
  const flowCards = FLOW_CARDS;

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

  // ─────────────────────────────────────────────────────────────────────────
  if (viewProjectId) {
    const viewing = projects.find((p) => p.id === viewProjectId);
    return (
      <UnitContext.Provider value={unitMode}>
        <div className="dark" style={{ colorScheme: "dark" }}>
          <div className="app-surface min-h-screen text-zinc-100">
            <div className="grain" aria-hidden />
            <ToastViewport toasts={toasts} />
            <ProjectOverview
              project={viewing}
              hoses={allHoses}
              onBack={closeProjectBom}
              onRename={renameProject}
              onRemoveHose={(partNo) => removeFromProject(viewProjectId, partNo)}
              onUpdateNote={(partNo, text) => updateProjectNote(viewProjectId, partNo, text)}
              onUpdateRole={(partNo, role) => updateProjectRole(viewProjectId, partNo, role)}
              onDismissBanner={() => dismissMissingBanner(viewProjectId)}
              onClearNotes={() => clearProjectNotes(viewProjectId)}
              onShare={() => shareProjectUrl(viewProjectId)}
            />
            <ShareImportDialog
              open={!!sharePayload}
              payload={sharePayload}
              hoses={allHoses}
              onImport={importSharedProject}
              onClose={closeShareImport}
            />
          </div>
        </div>
      </UnitContext.Provider>
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
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <Badge className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] tracking-[0.18em] text-zinc-300 backdrop-blur uppercase">
                {t("hero.eyebrow")}
              </Badge>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white md:text-6xl">
                {t("hero.title1")}
                <span className={`block bg-gradient-to-r ${ACCENT} bg-clip-text text-transparent`}>
                  {t("hero.title2")}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
                {t("hero.subtitle")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  className={`rounded-2xl bg-gradient-to-r ${ACCENT} px-5 text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.6)] transition hover:shadow-[0_14px_44px_-8px_rgba(217,70,239,0.7)]`}
                  onClick={() => {
                    setShapeMode(false);
                    setStep(flow === "all" ? 1 : step);
                  }}
                >
                  {t("hero.ctaStart")}
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-100 backdrop-blur transition hover:border-violet-400/30 hover:bg-white/[0.08]"
                  onClick={() => setShapeMode((prev) => !prev)}
                >
                  {t("hero.ctaBrowse")}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="text-sm text-zinc-400 transition hover:text-white"
                >
                  {t("hero.ctaGuide")}
                </button>
                <button
                  type="button"
                  onClick={() => setKeyboardHelpOpen(true)}
                  className="hidden items-center gap-1.5 text-xs text-zinc-500 transition hover:text-white sm:inline-flex"
                  aria-label={t("common.shortcuts")}
                >
                  {t("common.shortcuts")} <Kbd>?</Kbd>
                </button>
              </div>
            </div>

            <HeroLiveCount
              total={allHoses.length}
              filtered={filtered.length}
              hasFilters={hasActiveFilters}
            />
          </div>
        </motion.div>

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
              <ArrowRight className="h-3 w-3 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
            </button>
          </div>
        )}

        {/* ── Flow cards ── */}
        <section className="mt-10">
          <div className="mb-5 min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
              <Sparkles className="h-3 w-3" />
              {t("wizard.sectionEyebrow")}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={`step-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="mt-1.5 text-2xl font-semibold tracking-tight text-white"
              >
                {step === 1 ? t("wizard.step1Prompt")
                  : step === 2 ? t("wizard.step2Prompt")
                  : step === 3 ? t("wizard.step3Prompt")
                  : t("wizard.resultsPrompt")}
              </motion.h2>
            </AnimatePresence>
          </div>
          {true ? (
            <>
              {(step === 1 || flow === "all") ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {flowCards.map((card, i) => {
                    const active = flow === card.key;
                    return (
                      <motion.button
                        key={card.key}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          setFlow(card.key);
                          setStep(2);
                        }}
                        className={`group relative overflow-hidden rounded-[28px] border p-5 text-left transition-[border-color,background-color,box-shadow] duration-300 ${
                          active
                            ? "border-violet-400/40 bg-violet-950/60 shadow-[0_18px_60px_-20px_rgba(139,92,246,0.55)]"
                            : "border-zinc-800 bg-zinc-900 hover:border-violet-400/25 hover:bg-zinc-900 hover:shadow-[0_18px_60px_-28px_rgba(139,92,246,0.45)]"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="flowCardGlow"
                            aria-hidden
                            className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${ACCENT}`}
                            transition={{ type: "spring", stiffness: 280, damping: 30 }}
                          />
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-base font-semibold text-white">{card.title}</div>
                              {active && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${ACCENT} text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.7)]`}
                                >
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                </motion.span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-zinc-400">{card.body}</p>
                          </div>
                          <Badge
                            className={`rounded-full border-0 shrink-0 transition-colors ${
                              active ? `bg-gradient-to-r ${ACCENT}` : "bg-white/10 text-zinc-300 group-hover:bg-white/15"
                            }`}
                          >
                            {card.chip}
                          </Badge>
                        </div>
                        <div
                          className={`mt-4 rounded-[20px] border p-3 transition-colors duration-300 ${
                            active
                              ? "border-violet-400/30 text-violet-200"
                              : "border-white/10 text-violet-300 group-hover:border-violet-400/20 group-hover:text-violet-200"
                          }`}
                          style={{ background: active ? "rgba(15,10,30,0.55)" : "rgba(0,0,0,0.4)" }}
                        >
                          <div className="h-16">
                            <MorphingHoseSilhouette family={card.key} />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <WizardSummaryStrip label="Step 1" value={flowSummary} onClick={() => setStep(1)} />
              )}

              {flow !== "all" && (
                <>
                  {step === 2 ? (
                    <WizardStepCard
                      step={2}
                      title="Your sizes"
                      subtitle="Enter the neck diameters you measured. Results start narrowing as soon as you type."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">End 1 diameter (I.D., inches)</label>
                            <MeasurementHint type="id" />
                          </div>
                          <Input type="number" step="0.01" min="0.1" max="4" value={targetId1}
                            onChange={e => setTargetId1(e.target.value)}
                            placeholder="e.g. 1.50"
                            className="rounded-2xl border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-600 [appearance:textfield]"
                          />
                          <CommonSizesPicker
                            value={targetId1}
                            onPick={setTargetId1}
                            validValues={needsSecondDiameter && targetId2 ? validPairingsFor(allHoses, targetId2) : null}
                            constraintLabel={needsSecondDiameter && targetId2 ? `pairs with ${targetId2}"` : ""}
                          />
                          <AnimatePresence>
                            {targetId1 !== "" && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="flex items-center gap-1.5 text-xs text-violet-300"
                              >
                                <Sparkles className="h-3 w-3" />
                                <AnimatedCount value={liveDiameterMatches} /> hose{liveDiameterMatches === 1 ? "" : "s"} match this diameter set
                                <MmHint value={targetId1} className="ml-auto text-[10px]" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {needsSecondDiameter && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">End 2 diameter (I.D., inches)</label>
                              <MeasurementHint type="id" />
                            </div>
                            <Input type="number" step="0.01" min="0.1" max="4" value={targetId2}
                              onChange={e => setTargetId2(e.target.value)}
                              placeholder="e.g. 1.25"
                              className="rounded-2xl border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-600 [appearance:textfield]"
                            />
                            <CommonSizesPicker
                              value={targetId2}
                              onPick={setTargetId2}
                              validValues={targetId1 ? validPairingsFor(allHoses, targetId1) : null}
                              constraintLabel={targetId1 ? `pairs with ${targetId1}"` : ""}
                            />
                            <AnimatePresence>
                              {targetId2 !== "" && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="flex items-center gap-1.5 text-xs text-violet-300"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <AnimatedCount value={liveDiameterMatches} /> hose{liveDiameterMatches === 1 ? "" : "s"} match both end sizes
                                  <MmHint value={targetId2} className="ml-auto text-[10px]" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                          <Button
                            onClick={() => setStep(3)}
                            disabled={!hasRequiredDimensions}
                            className={`group h-11 rounded-2xl px-5 transition ${
                              hasRequiredDimensions
                                ? `border-0 bg-gradient-to-r ${ACCENT} text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`
                                : "border border-white/10 bg-white/[0.04] text-zinc-500 cursor-not-allowed"
                            }`}
                          >
                            {t("common.continue")}
                            <ChevronRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
                          </Button>
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            disabled={!hasRequiredDimensions}
                            className="text-xs text-zinc-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Skip to length
                          </button>
                        </div>
                      </div>
                    </WizardStepCard>
                  ) : (
                    <div className="mt-6">
                      <WizardSummaryStrip label="Step 2" value={sizeSummary} onClick={() => setStep(2)} />
                    </div>
                  )}

                  {hasRequiredDimensions && step !== 2 && (
                    step === 3 ? (
                      <WizardStepCard
                        step={3}
                        title="Route length"
                        subtitle="Add a centerline length if you have one, or skip and browse by size first."
                      >
                        <div className="space-y-5">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Centerline length (inches)</label>
                              <MeasurementHint type="length" />
                            </div>
                            <Input type="number" step="0.1" min="1" max="100" value={targetLen}
                              onChange={e => setTargetLen(e.target.value)}
                              placeholder="e.g. 18.5"
                              className="rounded-2xl border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-600 [appearance:textfield]"
                            />
                            <AnimatePresence>
                              {targetLen !== "" && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="flex items-center gap-1.5 text-xs text-violet-300"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <AnimatedCount value={liveLengthMatches} /> hose{liveLengthMatches === 1 ? "" : "s"} fit this routed length
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Length tolerance</label>
                              <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${ACCENT} px-2.5 py-0.5 text-[11px] font-semibold tabular text-white shadow-[0_4px_14px_-2px_rgba(139,92,246,0.5)]`}>
                                {lenTol[0] >= 99 ? "Any" : <>±{lenTol[0].toFixed(1)}<span className="opacity-70">"</span></>}
                              </span>
                            </div>
                            <Slider min={0.5} max={6} step={0.5} value={lenTol[0] >= 99 ? [6] : lenTol} onValueChange={setLenTol} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              onClick={() => setStep("results")}
                              className={`group h-11 rounded-2xl border-0 bg-gradient-to-r ${ACCENT} px-5 text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.55)] transition hover:shadow-[0_14px_40px_-8px_rgba(217,70,239,0.65)]`}
                            >
                              Show results
                              <ChevronRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setLenTol([99]);
                                setStep("results");
                              }}
                              className="text-xs text-zinc-500 transition hover:text-white"
                            >
                              {t("common.skipForNow")}
                            </button>
                          </div>
                        </div>
                      </WizardStepCard>
                    ) : (
                      <div className="mt-6">
                        <WizardSummaryStrip label="Step 3" value={lengthSummary || "Length: Not set"} onClick={() => setStep(3)} />
                      </div>
                    )
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-400">The full filter sidebar stays available here for power users who want every control at once.</p>
          )}

          {shapeMode && pageMap.length > 0 && (
            <ShapeBrowser
              allRows={allRows}
              allHoses={allHoses}
              pageMap={pageMap}
              selectedRows={selectedRows}
              selectedSilhouettes={silhouettes}
              onToggleSilhouette={(sil) => {
                setSilhouettes(prev => {
                  const next = new Set(prev);
                  if (next.has(sil)) next.delete(sil);
                  else next.add(sil);
                  return next;
                });
              }}
              onTogglePage={toggleShapePage}
              onClearAll={() => {
                setSelectedRows(new Set());
                setSilhouettes(new Set());
              }}
              onShowResults={() => {
                setShapeMode(false);
                setStep("results");
              }}
              resultCount={filtered.length}
            />
          )}
        </section>

        {/* ── Refine disclosure — one progressive-depth surface for every viewport ── */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowRefine((prev) => !prev)}
            aria-expanded={showRefine}
            className="group inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-violet-400/30 hover:bg-white/[0.06]"
          >
            <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
              <SlidersHorizontal className="h-3.5 w-3.5 text-violet-300" />
              {t("refine.label")}
              {hasActiveFilters && (
                <span className={`inline-flex h-1.5 w-1.5 rounded-full bg-gradient-to-r ${ACCENT} shadow-[0_0_8px_rgba(217,70,239,0.7)]`} />
              )}
              <span className="text-xs text-zinc-500">{t("refine.subtitle")}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${showRefine ? "rotate-180 text-violet-300" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {showRefine && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <motion.aside
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-3 overflow-hidden rounded-[32px] border border-white/10 backdrop-blur-xl"
                  style={{
                    background:
                      "radial-gradient(40rem 14rem at 0% 0%, rgba(139,92,246,0.08), transparent 60%)," +
                      "linear-gradient(180deg, rgba(20,20,28,0.7), rgba(10,10,15,0.7))",
                    boxShadow:
                      "0 24px 80px -28px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-60`} />
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
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Results ── */}
        <div className="mt-6">
            {!loading && !hasActiveFilters && recentHoses.length > 0 && (
              <RecentlyViewedStrip hoses={recentHoses} onSelect={setSelected} />
            )}
            {/* Results header */}
            {canShowResults && !loading && (
              <>
                <SavedSearchesStrip
                  items={savedSearches}
                  onApply={applySavedSearch}
                  onRemove={removeSavedSearch}
                  onSave={saveCurrentSearch}
                  onShare={shareCurrentSearch}
                  canSave={hasActiveFilters}
                />
                <LengthClassChips
                  candidates={lengthClassCandidates}
                  value={lengthClass}
                  onChange={setLengthClass}
                />
                <CurvatureChips
                  candidates={curvatureCandidates}
                  value={curvature}
                  onChange={setCurvature}
                />
                {flow === "reducer" && (
                  <StepRatioChips
                    candidates={stepRatioCandidates}
                    value={stepRatio}
                    onChange={setStepRatio}
                  />
                )}
              </>
            )}
            <ActiveFilterStrip
              targetId1={targetId1}
              targetId2={targetId2}
              targetLen={targetLen}
              idTol={idTol[0]}
              lenTol={lenTol[0]}
              flow={flow}
              selectedRows={selectedRows}
              rowMetaByNo={rowMetaByNo}
              resultCount={filtered.length}
              onClearId={clearIdFilters}
              onClearLen={clearLengthFilter}
              onClearType={clearFlowFilter}
              onClearRows={clearRowFilters}
            />
            <div
              className="sticky top-3 z-30 mb-5 overflow-hidden rounded-[28px] border border-white/10 backdrop-blur-xl"
              style={{
                background:
                  "linear-gradient(160deg, rgba(20,20,26,0.78), rgba(10,10,16,0.78))",
                boxShadow:
                  "0 16px 50px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-50`} />
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Results</div>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                    <div className="flex items-baseline gap-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {loading ? (
                        <span className="flex items-center gap-2 text-base text-zinc-400">
                          <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                          Loading catalog…
                        </span>
                      ) : canShowResults ? (
                        <>
                          <span className="tabular"><AnimatedCount value={filtered.length} /></span>
                          <span className="text-sm font-normal text-zinc-500">
                            hose{filtered.length !== 1 ? "s" : ""}
                          </span>
                        </>
                      ) : (
                        <span className="text-base text-zinc-400">Enter a size to start narrowing</span>
                      )}
                    </div>
                    {hasActiveFilters && filtered.length > 0 && (canShowResults) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {exactCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tabular text-emerald-300">
                            <Check className="h-2.5 w-2.5" /> {exactCount} exact
                          </span>
                        )}
                        {closeCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold tabular text-sky-300">
                            {closeCount} close
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="relative flex items-center gap-0.5 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                    {[
                      { key: "grid",    icon: LayoutGrid, label: "Grid"    },
                      { key: "list",    icon: List,       label: "List"    },
                      { key: "compact", icon: Table2,     label: "Compact" },
                    ].map((option) => {
                      const active = viewMode === option.key;
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          aria-label={option.label}
                          aria-pressed={active}
                          onClick={() => setViewMode(option.key)}
                          className={`relative flex h-8 w-9 items-center justify-center rounded-xl text-zinc-400 transition ${
                            active ? "text-white" : "hover:bg-white/[0.06] hover:text-zinc-200"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="viewModePill"
                              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${ACCENT} shadow-[0_8px_22px_-8px_rgba(139,92,246,0.6)]`}
                              transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            />
                          )}
                          <Icon className="relative h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] pl-2.5">
                    <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
                    <Select value={sortMode} onValueChange={setSortMode}>
                      <SelectTrigger className="h-9 w-40 rounded-2xl border-0 bg-transparent text-xs text-zinc-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Best match</SelectItem>
                        <SelectItem value="id">By diameter</SelectItem>
                        <SelectItem value="len">By length</SelectItem>
                        <SelectItem value="part">By part number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <HoseCardSkeleton key={i} idx={i} />
                ))}
              </div>
            ) : !canShowResults ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-[32px] border border-white/10"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(139,92,246,0.08), rgba(217,70,239,0.04) 60%, rgba(20,20,26,0.95))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${ACCENT} opacity-50`} />
                <div className="flex flex-col items-center gap-4 p-10 text-center">
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-200"
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                  <div>
                    <div className="text-xl font-semibold tracking-tight text-white">Add a measurement to begin</div>
                    <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-zinc-400">
                      Pick a hose type above, then enter an end diameter or length. Results stream in live as you type — no need to press search.
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      <Ruler className="h-3 w-3 text-violet-300" /> Diameter
                    </span>
                    <span className="text-zinc-600">or</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      <ArrowUpDown className="h-3 w-3 text-violet-300" /> Length
                    </span>
                    <span className="text-zinc-600">or</span>
                    <button
                      type="button"
                      onClick={() => { setWizardMode(true); setShapeMode(true); }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/20"
                    >
                      <Layers3 className="h-3 w-3" /> Browse shapes
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : filtered.length === 0 ? (
              <>
                {fuzzyPartSuggestions.length > 0 && (
                  <div className="mb-4 rounded-[22px] border border-violet-400/25 bg-violet-500/8 p-4">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">Did you mean…</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fuzzyPartSuggestions.map((h) => (
                        <button
                          key={h.partNo}
                          type="button"
                          onClick={() => setSearch(h.partNo)}
                          className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-100 transition hover:border-violet-400/40 hover:bg-white/[0.08] hover:text-white"
                        >
                          <span className="font-semibold tabular">{h.partNo}</span>
                          <span className="text-xs text-zinc-400 tabular"><Dim value={h.hoseId} /> · <Dim value={h.length} /></span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <SmartEmptyState
                  targetId1={dTargetId1}
                  targetId2={dTargetId2}
                  targetLen={dTargetLen}
                  allHoses={allHoses}
                  onSelect={setSelected}
                  onApply={({ idTol: newIdTol, lenTol: newLenTol }) => {
                    setIdTol([newIdTol]);
                    setLenTol([newLenTol]);
                  }}
                  onClearLength={clearLengthFilter}
                  onClearId={clearIdFilters}
                  onShowGuide={() => setShowGuide(true)}
                />
              </>
            ) : (
              <>
                {viewMode === "compact" ? (
                      <HoseCompactTable
                        hoses={paginated}
                        onSelect={setSelected}
                        shortlist={shortlist}
                        toggleShortlist={toggleShortlist}
                        onShowRow={showRow}
                        rowCounts={rowCounts}
                      />
                ) : (
                  <div className={viewMode === "list" ? "space-y-4" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
                    <AnimatePresence mode="popLayout">
                      {paginated.map((hose, i) => (
                        viewMode === "list" ? (
                          <HoseListCard
                            key={hose.partNo}
                            hose={hose}
                            idx={i}
                            onSelect={setSelected}
                            shortlist={shortlist}
                            toggleShortlist={toggleShortlist}
                            onShowRow={showRow}
                            onFindSimilar={findSimilar}
                            rowCount={rowCounts[hose.rowNo]}
                          />
                        ) : (
                          <HoseCard
                            key={hose.partNo}
                            hose={hose}
                            idx={i}
                            onSelect={setSelected}
                            shortlist={shortlist}
                            toggleShortlist={toggleShortlist}
                            onShowRow={showRow}
                            onFindSimilar={findSimilar}
                            rowCount={rowCounts[hose.rowNo]}
                          />
                        )
                      ))}
                    </AnimatePresence>
                  </div>
                )}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => setPage(p => p + 1)}
                      className="rounded-2xl border-white/10 bg-white/5 px-8 text-zinc-300 hover:bg-white/10 hover:text-white"
                    >
                      Load more <ChevronDown className="ml-2 h-4 w-4" />
                      <span className="ml-2 text-zinc-500 text-xs">({filtered.length - paginated.length} remaining)</span>
                    </Button>
                  </div>
                )}
              </>
            )}
        </div>
      </main>

      {/* ── Compare bar ── */}
      <AnimatePresence>
        {compared.length > 0 && (
          <CompareBar
            compared={compared}
            toggleCompare={toggleCompare}
            clearCompare={() => setCompare([])}
            open={compareOpen}
            onToggleOpen={() => openCompareExclusive((prev) => !prev)}
            onOpenCompareView={() => setCompareModalOpen(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(shortlisted.length > 0 || shortlistWarning || shortlistOpen) && (
          <ShortlistBar
            shortlisted={shortlisted}
            open={shortlistOpen}
            onToggleOpen={() => openShortlistExclusive((prev) => !prev)}
            onSelect={(hose) => {
              setSelected(hose);
              setShortlistOpen(false);
            }}
            onToggleShortlist={toggleShortlist}
            onPrint={printShortlist}
            onClear={clearShortlist}
            warning={shortlistWarning}
            projectName={activeProject?.name}
            projectCount={projects.length}
            onOpenProjects={() => setProjectManagerOpen(true)}
            onOpenBom={activeProject ? () => openProjectBom(activeProject.id) : undefined}
          />
        )}
      </AnimatePresence>

      <ProjectManager
        open={projectManagerOpen}
        onClose={() => setProjectManagerOpen(false)}
        projects={projects}
        activeId={activeProjectId}
        onSwitch={setActiveProjectId}
        onRename={renameProject}
        onCreate={createProject}
        onDuplicate={duplicateProject}
        onDelete={deleteProject}
        onOpenBom={openProjectBom}
      />
      <ShareImportDialog
        open={!!sharePayload}
        payload={sharePayload}
        hoses={allHoses}
        onImport={importSharedProject}
        onClose={closeShareImport}
      />
      <SimilarShapeSheet
        open={!!similarForHose}
        target={similarForHose}
        allHoses={allHoses}
        onClose={() => setSimilarForHose(null)}
        onSelect={(h) => setSelected(h)}
      />
      <PhotoMeasureDialog
        open={photoMeasureOpen}
        onClose={() => setPhotoMeasureOpen(false)}
        onApply={applyPhotoMeasurement}
      />

      {/* ── Compare modal ── */}
      <CompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        hoses={compared}
        onRemove={(partNo) => {
          toggleCompare(partNo);
          if (compared.length <= 1) setCompareModalOpen(false);
        }}
        onSelect={(hose) => {
          setCompareModalOpen(false);
          setSelected(hose);
        }}
      />

      {/* ── Detail modal ── */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DetailModal
          hose={selected}
          onClose={() => setSelected(null)}
          suggestions={suggestions}
          onSelect={setSelected}
          onShowRow={showRow}
          onFindSimilar={findSimilar}
          rowCount={selected ? rowCounts[selected.rowNo] : 0}
          rowMeta={selected ? rowMetaByNo[selected.rowNo] : null}
          shortlist={shortlist}
          toggleShortlist={toggleShortlist}
          compare={compare}
          toggleCompare={toggleCompare}
          pairSuggestions={pairSuggestions}
          onDisablePairing={disablePairing}
        />
      </Dialog>

      {/* ── Measurement guide ── */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-white">
              <Ruler className="h-6 w-6 text-violet-300" /> {t("guide.title")}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">{t("guide.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <MeasurementGuide />
          </div>
        </DialogContent>
      </Dialog>

      <CatalogFooter meta={catalogMeta} />
    </div>
    </div>
    </UnitContext.Provider>
    </LocaleContext.Provider>
  );
}

// CatalogFooter moved to ./src/components/CatalogFooter.jsx

// SAMPLE_HOSES moved to ./src/lib/sampleHoses.js
