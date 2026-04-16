// One-shot fetch of the static catalogue JSON + enrichment. Falls back to
// the sample data array when `data/hoses.json` isn't available (e.g. in a
// fresh clone before the user runs the extraction script).

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
 * }}
 */
export function useCatalogData() {
  const [rawHoses, setRawHoses]   = useState([]);
  const [allRows, setAllRows]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catalogMeta, setCatalogMeta] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      fetch("data/hoses.json").then((r) => r.json()),
      fetch("data/rows.json").then((r) => r.json()),
      fetch("data/catalog-meta.json").then((r) => r.json()),
    ]).then(([hosesResult, rowsResult, metaResult]) => {
      if (hosesResult.status === "fulfilled") setRawHoses(hosesResult.value);
      else setRawHoses(SAMPLE_HOSES);

      if (rowsResult.status === "fulfilled") setAllRows(rowsResult.value);
      else setAllRows([]);

      if (metaResult.status === "fulfilled") setCatalogMeta(metaResult.value);

      setLoading(false);
    });
  }, []);

  const allHoses = useMemo(() => rawHoses.map(enrichHose), [rawHoses]);

  return { rawHoses, allHoses, allRows, loading, catalogMeta };
}
