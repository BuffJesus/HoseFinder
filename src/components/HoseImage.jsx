// Hose image renderer with a three-step fallback chain:
//   individual hose silhouette PNG → full catalog page JPG → SVG silhouette.
// The first real asset that resolves wins; onError walks the chain.

import React, { useState } from "react";
import { HoseSilhouette } from "./HoseSilhouette.jsx";

const CATALOG_IMG_BASE = "images/catalog/page-";
const HOSE_IMG_BASE = "images/hoses/";

export function catalogImgSrc(catalogPage) {
  if (!catalogPage) return null;
  return `${CATALOG_IMG_BASE}${String(catalogPage).padStart(3, "0")}.jpg`;
}

export function hoseImgSrc(partNo) {
  if (!partNo) return null;
  return `${HOSE_IMG_BASE}${partNo}.png`;
}

/**
 * @param {{
 *   partNo: string,
 *   catalogPage?: number,
 *   silhouette: string,
 *   className?: string,
 *   imgClassName?: string,
 *   preferCatalog?: boolean,
 * }} props
 */
export function HoseImage({ partNo, catalogPage, silhouette, className = "", imgClassName = "", preferCatalog = false }) {
  const [mode, setMode] = useState(preferCatalog ? "catalog" : "hose");

  if (mode === "silhouette") {
    return (
      <div className={`flex items-center justify-center ${className}`.trim()}>
        <div className={`text-violet-300 ${imgClassName}`.trim()}>
          <HoseSilhouette type={silhouette} />
        </div>
      </div>
    );
  }

  const src = mode === "catalog" ? catalogImgSrc(catalogPage) : hoseImgSrc(partNo);

  return (
    <div className={`flex items-center justify-center ${className}`.trim()}>
      {src ? (
        <img
          src={src}
          alt={`Gates ${partNo} hose silhouette`}
          loading="lazy"
          className={imgClassName}
          onError={() => {
            if (mode === "hose" && catalogPage) setMode("catalog");
            else setMode("silhouette");
          }}
        />
      ) : (
        <div className={`text-violet-300 ${imgClassName}`.trim()}>
          <HoseSilhouette type={silhouette} />
        </div>
      )}
    </div>
  );
}

/**
 * Larger decorated image tile — used in the detail modal to show "catalog
 * page" and "silhouette" views side by side.
 * @param {{
 *   label: string,
 *   mode: "catalog" | "hose",
 *   partNo: string,
 *   silhouette: string,
 *   catalogPage?: number,
 * }} props
 */
export function ImageTile({ label, mode, partNo, silhouette, catalogPage }) {
  const preferCatalog = mode === "catalog";
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 opacity-0 transition group-hover:opacity-100" />
      <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-zinc-400">{label}</div>
      <HoseImage
        partNo={partNo}
        catalogPage={catalogPage}
        silhouette={silhouette}
        preferCatalog={preferCatalog}
        className="h-28"
        imgClassName={preferCatalog
          ? "h-full w-full rounded-2xl object-cover object-top opacity-80"
          : "h-full w-auto max-w-full object-contain"}
      />
    </div>
  );
}
