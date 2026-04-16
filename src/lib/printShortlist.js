// Generate the print-ready shortlist sheet and kick off the browser print
// dialog in a new tab. Pure in the "no React state" sense; opens a new
// window as its sole side effect. Returns "ok" | "popup-blocked" | "empty"
// so the caller can decide how to toast the user.

import { fmtDim } from "./units.js";

/**
 * @typedef {{
 *   partNo: string,
 *   hoseId: string | number,
 *   length: string | number,
 *   hoseType: string,
 *   visualFamily: string,
 * }} PrintableHose
 *
 * @typedef {"ok" | "popup-blocked" | "empty"} PrintResult
 */

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render the shortlist into a standalone HTML document that's safe to
 * print. Split out so tests can assert on the string without opening a
 * browser window.
 * @param {PrintableHose[]} shortlisted
 * @param {"in" | "mm"} unitMode
 * @param {{ generatedAt?: Date }} [opts]
 * @returns {string}
 */
export function renderShortlistHtml(shortlisted, unitMode, opts = {}) {
  const { generatedAt = new Date() } = opts;
  const rows = shortlisted.map((h) => `
      <tr>
        <td>${escapeHtml(h.partNo)}</td>
        <td>${escapeHtml(fmtDim(h.hoseId, unitMode))}</td>
        <td>${escapeHtml(fmtDim(h.length, unitMode))}</td>
        <td>${escapeHtml(h.hoseType)}</td>
        <td>${escapeHtml(h.visualFamily)}</td>
      </tr>
    `).join("");

  const countLabel = `${shortlisted.length} part${shortlisted.length === 1 ? "" : "s"}`;

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>HoseFinder Parts List</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { margin: 0 0 24px; color: #4b5563; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; }
          th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
        </style>
      </head>
      <body>
        <h1>Gates Molded Coolant Hose Parts List</h1>
        <p>Generated ${escapeHtml(generatedAt.toLocaleDateString())} · ${countLabel}</p>
        <table>
          <thead>
            <tr><th>Part #</th><th>I.D.</th><th>Length</th><th>Type</th><th>Shape</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`;
}

/**
 * Open a new window with the rendered shortlist and trigger print().
 * Caller handles the user-facing messaging based on the returned status.
 * @param {PrintableHose[]} shortlisted
 * @param {"in" | "mm"} unitMode
 * @returns {PrintResult}
 */
export function printShortlist(shortlisted, unitMode) {
  if (!shortlisted || shortlisted.length === 0) return "empty";
  const html = renderShortlistHtml(shortlisted, unitMode);
  const printWindow = (typeof window !== "undefined")
    ? window.open("", "_blank", "noopener,noreferrer")
    : null;
  if (!printWindow) return "popup-blocked";
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return "ok";
}
