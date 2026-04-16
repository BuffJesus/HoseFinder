// All filter state — numeric targets, tolerances, dropdowns, set-based
// chips, sort/view mode, plus the wizard's `showRefine` + `shapeMode`
// switches. Owns URL hydrate/sync (the QS is the source of truth so any
// link is shareable, refresh-safe, back-button friendly), `viewMode`
// localStorage persistence, debounced numeric inputs, and the derived
// `hasActiveFilters` / `hasManualInputs` predicates everything else
// keys off of.
//
// `onHydrateMeaningful` lets the caller jump the wizard straight to
// "results" when a non-empty filter URL is opened, without this hook
// having to know about wizard step state.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIEW_MODE_KEY = "hosefinder-view-mode";

function loadViewMode() {
  if (typeof window === "undefined") return "grid";
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list" || stored === "compact") return stored;
  } catch {}
  return window.matchMedia("(max-width: 767px)").matches ? "list" : "grid";
}

/**
 * @param {{ onHydrateMeaningful?: () => void }} [opts]
 */
export function useFilters(opts = {}) {
  const [targetId1, setTargetId1] = useState("");
  const [targetId2, setTargetId2] = useState("");
  const [targetLen, setTargetLen] = useState("");
  const [idTol, setIdTol] = useState([0.06]);
  const [lenTol, setLenTol] = useState([2.0]);
  const [hoseTypeFilter, setHoseTypeFilter] = useState("all");
  const [sizeBandFilter, setSizeBandFilter] = useState("all");
  const [endCountFilter, setEndCountFilter] = useState("all");
  const [flow, setFlow] = useState("all");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("score");
  const [viewMode, setViewMode] = useState(loadViewMode);
  const [showRefine, setShowRefine] = useState(false);
  const [shapeMode, setShapeMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState(() => new Set());
  const [silhouettes, setSilhouettes] = useState(() => new Set());
  const [curvature, setCurvature] = useState(() => new Set());
  const [lengthClass, setLengthClass] = useState(() => new Set());
  const [stepRatio, setStepRatio] = useState(() => new Set());

  // ── viewMode persistence ───────────────────────────────────────────────
  useEffect(() => {
    try { window.localStorage.setItem(VIEW_MODE_KEY, viewMode); } catch {}
  }, [viewMode]);

  // ── Debounced numeric inputs (avoid filtering mid-typing) ──────────────
  const [dTargetId1, setDTargetId1] = useState(targetId1);
  const [dTargetId2, setDTargetId2] = useState(targetId2);
  const [dTargetLen, setDTargetLen] = useState(targetLen);
  const [dSearch, setDSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => {
      setDTargetId1(targetId1);
      setDTargetId2(targetId2);
      setDTargetLen(targetLen);
      setDSearch(search);
    }, 150);
    return () => clearTimeout(t);
  }, [targetId1, targetId2, targetLen, search]);

  // ── Derived predicates ─────────────────────────────────────────────────
  const hasActiveFilters = targetId1 !== "" || targetId2 !== "" || targetLen !== "" || flow !== "all" || search.trim() !== "" || sizeBandFilter !== "all" || endCountFilter !== "all" || selectedRows.size > 0 || silhouettes.size > 0 || curvature.size > 0 || lengthClass.size > 0 || stepRatio.size > 0;
  const hasManualInputs = targetId1 !== "" || targetId2 !== "" || targetLen !== "" || flow !== "all" || search.trim() !== "" || sizeBandFilter !== "all" || endCountFilter !== "all" || selectedRows.size > 0;

  // ── Reset action ───────────────────────────────────────────────────────
  const clearAllFilters = useCallback(() => {
    setTargetId1("");
    setTargetId2("");
    setTargetLen("");
    setIdTol([0.06]);
    setLenTol([2.0]);
    setHoseTypeFilter("all");
    setSizeBandFilter("all");
    setEndCountFilter("all");
    setFlow("all");
    setSearch("");
    setShapeMode(false);
    setSelectedRows(new Set());
    setSilhouettes(new Set());
    setCurvature(new Set());
    setLengthClass(new Set());
    setStepRatio(new Set());
  }, []);

  // ── Preset application ─────────────────────────────────────────────────
  const applyPresetFilters = useCallback((preset) => {
    setTargetId1(preset.targetId1);
    setTargetId2(preset.targetId2);
    setTargetLen(preset.targetLen);
    setLenTol([preset.lenTol]);
    setIdTol([preset.idTol]);
    setHoseTypeFilter("all");
    setSizeBandFilter("all");
    setEndCountFilter("all");
    setFlow(preset.flow);
    setSearch("");
    setShapeMode(false);
    setSelectedRows(new Set());
    setShowRefine(true);
  }, []);

  // ── Snapshot for saved-search persistence ──────────────────────────────
  const captureSearchParams = useCallback(() => ({
    flow,
    targetId1, targetId2, targetLen,
    idTol: idTol[0], lenTol: lenTol[0],
    search: search.trim(),
    sizeBandFilter, endCountFilter,
    sortMode,
    curvature: [...curvature],
    lengthClass: [...lengthClass],
    stepRatio: [...stepRatio],
    silhouettes: [...silhouettes],
    selectedRows: [...selectedRows],
  }), [flow, targetId1, targetId2, targetLen, idTol, lenTol, search, sizeBandFilter, endCountFilter, sortMode, curvature, lengthClass, stepRatio, silhouettes, selectedRows]);

  // ── URL state sync ─────────────────────────────────────────────────────
  const urlHydrated = useRef(false);
  const onHydrateMeaningful = opts.onHydrateMeaningful;
  useEffect(() => {
    if (urlHydrated.current) return;
    urlHydrated.current = true;
    const p = new URLSearchParams(window.location.search);
    if (p.has("flow"))   setFlow(p.get("flow"));
    if (p.has("id1"))    setTargetId1(p.get("id1"));
    if (p.has("id2"))    setTargetId2(p.get("id2"));
    if (p.has("len"))    setTargetLen(p.get("len"));
    if (p.has("itol")) {
      const v = parseFloat(p.get("itol"));
      if (!isNaN(v)) setIdTol([v]);
    }
    if (p.has("ltol")) {
      const v = parseFloat(p.get("ltol"));
      if (!isNaN(v)) setLenTol([v]);
    }
    if (p.has("q"))    setSearch(p.get("q"));
    if (p.has("sb"))   setSizeBandFilter(p.get("sb"));
    if (p.has("ec"))   setEndCountFilter(p.get("ec"));
    if (p.has("sort")) setSortMode(p.get("sort"));
    if (p.has("v"))    setViewMode(p.get("v"));
    if (p.has("c"))    setCurvature(new Set(p.get("c").split(",").filter(Boolean)));
    if (p.has("lc"))   setLengthClass(new Set(p.get("lc").split(",").filter(Boolean)));
    if (p.has("sr"))   setStepRatio(new Set(p.get("sr").split(",").filter(Boolean)));
    if (p.has("sil"))  setSilhouettes(new Set(p.get("sil").split(",").filter(Boolean)));
    if (p.has("rows")) setSelectedRows(new Set(p.get("rows").split(",").map(Number).filter((n) => !isNaN(n))));
    if ([...p.keys()].some((k) => ["id1","id2","len","q","sb","ec","c","lc","rows","flow"].includes(k))) {
      onHydrateMeaningful?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!urlHydrated.current) return;
    const p = new URLSearchParams();
    if (flow !== "all")              p.set("flow", flow);
    if (targetId1)                   p.set("id1", targetId1);
    if (targetId2)                   p.set("id2", targetId2);
    if (targetLen)                   p.set("len", targetLen);
    if (idTol[0] !== 0.06)           p.set("itol", String(idTol[0]));
    if (lenTol[0] !== 2.0)           p.set("ltol", String(lenTol[0]));
    if (search.trim())               p.set("q", search.trim());
    if (sizeBandFilter !== "all")    p.set("sb", sizeBandFilter);
    if (endCountFilter !== "all")    p.set("ec", endCountFilter);
    if (sortMode !== "score")        p.set("sort", sortMode);
    if (viewMode !== "grid")         p.set("v", viewMode);
    if (curvature.size > 0)          p.set("c", [...curvature].join(","));
    if (lengthClass.size > 0)        p.set("lc", [...lengthClass].join(","));
    if (stepRatio.size > 0)          p.set("sr", [...stepRatio].join(","));
    if (silhouettes.size > 0)        p.set("sil", [...silhouettes].join(","));
    if (selectedRows.size > 0)       p.set("rows", [...selectedRows].join(","));
    const qs = p.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", url);
    }
  }, [flow, targetId1, targetId2, targetLen, idTol, lenTol, search, sizeBandFilter, endCountFilter, sortMode, viewMode, curvature, lengthClass, stepRatio, silhouettes, selectedRows]);

  // Bundled filterParams object — every consumer needed the same shape.
  const filterParams = useMemo(() => ({
    targetId1: dTargetId1, targetId2: dTargetId2, targetLen: dTargetLen,
    idTol: idTol[0], lenTol: lenTol[0],
    hoseTypeFilter, sizeBandFilter, endCountFilter,
    flow, search: dSearch,
    curvature, lengthClass, stepRatio, silhouettes,
  }), [dTargetId1, dTargetId2, dTargetLen, idTol, lenTol, hoseTypeFilter, sizeBandFilter, endCountFilter, flow, dSearch, curvature, lengthClass, stepRatio, silhouettes]);

  return {
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
  };
}
