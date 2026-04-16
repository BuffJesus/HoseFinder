// One-shot fetch of the static catalogue JSON + enrichment. Falls back to
// the sample data array when `data/hoses.json` isn't available (e.g. in a
// fresh clone before the user runs the extraction script).
//
// Shape signatures (data/shape_signatures.json, produced by
// scripts/extract_shape_signatures.py) are merged onto each hose as a
// `shape` field when available. Missing signatures leave `shape` undefined
// — the app treats that as "no geometric match available."

import { useEffect, useMemo, useState } from "react";
import { enrichHose } from "../lib/enrichHose.js";
import { SAMPLE_HOSES } from "../lib/sampleHoses.js";

/**
 * @returns {{
 *   rawHoses: any[],
 *   allHoses: any[],
 *   allRows: any[],
 *   loading: boolean,
 *   catalogMeta: any | null,
 *   shapeSignatures: Record<string, any>,
 * }}
 */
export function useCatalogData() {
  const [rawHoses, setRawHoses]   = useState([]);
  const [allRows, setAllRows]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catalogMeta, setCatalogMeta] = useState(null);
  const [shapeSignatures, setShapeSignatures] = useState(/** @type {Record<string, any>} */ ({}));

  useEffect(() => {
    Promise.allSettled([
      fetch("data/hoses.json").then((r) => r.json()),
      fetch("data/rows.json").then((r) => r.json()),
      fetch("data/catalog-meta.json").then((r) => r.json()),
      fetch("data/shape_signatures.json").then((r) => r.json()),
    ]).then(([hosesResult, rowsResult, metaResult, sigResult]) => {
      if (hosesResult.status === "fulfilled") setRawHoses(hosesResult.value);
      else setRawHoses(SAMPLE_HOSES);

      if (rowsResult.status === "fulfilled") setAllRows(rowsResult.value);
      else setAllRows([]);

      if (metaResult.status === "fulfilled") setCatalogMeta(metaResult.value);

      if (sigResult.status === "fulfilled") setShapeSignatures(sigResult.value || {});

      setLoading(false);
    });
  }, []);

  const allHoses = useMemo(
    () => rawHoses.map((h) => {
      const enriched = enrichHose(h);
      const sig = shapeSignatures[enriched.partNo];
      return sig ? { ...enriched, shape: sig } : enriched;
    }),
    [rawHoses, shapeSignatures],
  );

  return { rawHoses, allHoses, allRows, loading, catalogMeta, shapeSignatures };
}
