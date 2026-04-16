// Two outbound link helpers for Gates' own properties — we never scrape
// them, we just deep-link.

/** gates.com search page for a given part number. */
export function gatesUrl(partNo) {
  return `https://www.gates.com/us/en/search.html?q=${encodeURIComponent(partNo)}`;
}

/** navigate.gates.com product page. Includes the 360° viewer for most parts. */
export function gates360Url(partNo) {
  return `https://navigates.gates.com/us/p/gates/${encodeURIComponent(partNo)}.html`;
}
