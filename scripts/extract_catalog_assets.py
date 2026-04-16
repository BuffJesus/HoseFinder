from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path

import fitz


CATALOG_IMAGE_START = 46
CATALOG_IMAGE_END = 216
ROW_PAGE_START = 46
ROW_PAGE_END = 214
ROW_Y_MIN = 180
ROW_Y_MAX = 740
ROW_NO_RE = re.compile(r"\d{1,3}")
PART_RE = re.compile(r"\d{5}")
SILHOUETTE_POOL = [
    "sweep",
    "elbow",
    "compound",
    "long",
    "hook",
    "gentle",
    "Zturn",
    "shortElbow",
    "deepS",
    "wideArc",
]
APPLICATION_LABELS = {
    "bypass": "Bypass line",
    "heater-small": "Heater hose",
    "heater-mid": "Heater / bypass",
    "heater-large": "Heater / degas",
    "radiator-small": "Lower radiator",
    "radiator-mid": "Upper/lower radiator",
    "radiator-large": "Large radiator",
    "radiator-xl": "Heavy-duty radiator",
}
SHAPE_LABELS = {
    "sweep": "S-curve",
    "elbow": "elbow",
    "compound": "compound S",
    "long": "long sweep",
    "hook": "J-hook",
    "gentle": "gentle curve",
    "Zturn": "Z-routing",
    "shortElbow": "tight elbow",
    "deepS": "deep S",
    "wideArc": "wide arc",
    "branch": "T-branch",
    "branchY": "Y-branch",
    "branchFour": "4-way branch",
}


@dataclass(frozen=True)
class HoseCrop:
    part_no: str
    page_no: int
    row_no: int
    left: float
    right: float
    band_top: float
    band_bottom: float
    part_top: float
    len_bottom: float


@dataclass(frozen=True)
class RowMarker:
    row_no: int
    y: float


def line_center(word: tuple[float, float, float, float, str, int, int, int]) -> float:
    return (word[1] + word[3]) / 2


def line_height(word: tuple[float, float, float, float, str, int, int, int]) -> float:
    return word[3] - word[1]


def row_markers(words: list[tuple]) -> list[RowMarker]:
    markers = []
    for word in words:
        text = word[4]
        y = line_center(word)
        if (
            word[0] < 80
            and ROW_Y_MIN < y < ROW_Y_MAX
            and line_height(word) >= 12
            and ROW_NO_RE.fullmatch(text)
        ):
            row_no = int(text)
            if 1 <= row_no <= 663:
                markers.append(RowMarker(row_no=row_no, y=y))
    markers.sort(key=lambda marker: marker.y)
    return markers


def cluster_lines(words: list[tuple], tolerance: float = 4) -> list[dict]:
    lines: list[dict] = []
    for word in sorted(words, key=lambda item: (line_center(item), item[0])):
        y = line_center(word)
        if not lines or abs(lines[-1]["y"] - y) > tolerance:
            lines.append({"y": y, "words": [word]})
        else:
            lines[-1]["words"].append(word)
    return lines


def tokens_in_interval(words: list[tuple], left: float, right: float, row_no: int) -> list[str]:
    tokens = []
    for word in sorted(words, key=lambda item: item[0]):
        center_x = (word[0] + word[2]) / 2
        text = word[4]
        if not (left <= center_x < right):
            continue
        if text == str(row_no) and word[0] < 80:
            continue
        tokens.append(text)
    return tokens


def clean_hose_id(tokens: list[str]) -> str:
    if not tokens:
        return ""
    text = " ".join(tokens)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace(" x ", " X ").replace(" X ", " X ")
    return text


def parse_length(tokens: list[str]) -> float | None:
    if not tokens:
        return None
    joined = "".join(tokens).replace(",", "")
    try:
        return float(joined)
    except ValueError:
        return None


def hose_id_bounds(hose_id: str) -> tuple[float | None, float | None]:
    parts = [float(part) for part in hose_id.split(" X ") if part]
    if not parts:
        return None, None
    return min(parts), max(parts)


def get_silhouette_type(row_no: int, hose_type: str, end_count: int) -> str:
    if hose_type == "branched":
        if end_count >= 4:
            return "branchFour"
        if end_count >= 3:
            return "branchY"
        return "branch"
    return SILHOUETTE_POOL[row_no % len(SILHOUETTE_POOL)]


def size_band_for(primary_id: float) -> str:
    if primary_id < 0.4:
        return "bypass"
    if primary_id < 0.65:
        return "heater-small"
    if primary_id < 0.9:
        return "heater-mid"
    if primary_id < 1.2:
        return "heater-large"
    if primary_id < 1.5:
        return "radiator-small"
    if primary_id < 1.9:
        return "radiator-mid"
    if primary_id < 2.5:
        return "radiator-large"
    return "radiator-xl"


def family_label_for(row_no: int, hose_id: str) -> tuple[str, str, str]:
    parts = [float(part) for part in hose_id.split(" X ") if part]
    end_count = len(parts)
    hose_type = "single" if end_count == 1 else "reducer" if end_count == 2 else "branched"
    primary_id = max(parts) if parts else 0
    size_band = size_band_for(primary_id)
    silhouette = get_silhouette_type(row_no, hose_type, end_count)
    prefix = "Reducer · " if hose_type == "reducer" else "Branched · " if hose_type == "branched" else ""
    label = f"{prefix}{APPLICATION_LABELS.get(size_band, 'Coolant hose')} · {SHAPE_LABELS.get(silhouette, 'curve')}"
    return label, hose_type, size_band


def extract_rows(doc: fitz.Document) -> tuple[list[dict], list[dict], list[HoseCrop]]:
    hoses: list[dict] = []
    row_groups: dict[int, dict] = {}
    hose_crops: list[HoseCrop] = []

    for page_no in range(ROW_PAGE_START, ROW_PAGE_END + 1):
        page = doc[page_no - 1]
        words = page.get_text("words")
        markers = row_markers(words)
        if not markers:
            continue

        for index, marker in enumerate(markers):
            band_top = ROW_Y_MIN if index == 0 else (markers[index - 1].y + marker.y) / 2
            band_bottom = ROW_Y_MAX if index == len(markers) - 1 else (marker.y + markers[index + 1].y) / 2
            band_words = [word for word in words if band_top <= line_center(word) < band_bottom]
            lines = cluster_lines(band_words)
            part_line = next((line for line in lines if sum(1 for word in line["words"] if PART_RE.fullmatch(word[4])) >= 1), None)
            if part_line is None:
                continue

            try:
                part_line_index = lines.index(part_line)
                id_line = lines[part_line_index + 1]
                len_line = lines[part_line_index + 2]
            except IndexError:
                continue

            part_words = [word for word in sorted(part_line["words"], key=lambda item: item[0]) if PART_RE.fullmatch(word[4])]
            if not part_words:
                continue

            centers = [((word[0] + word[2]) / 2) for word in part_words]
            boundaries = [0.0]
            for left, right in zip(centers, centers[1:]):
                boundaries.append((left + right) / 2)
            boundaries.append(page.rect.width + 1)

            row_count = 0
            for part_index, word in enumerate(part_words):
                left = boundaries[part_index]
                right = boundaries[part_index + 1]
                hose_id = clean_hose_id(tokens_in_interval(id_line["words"], left, right, marker.row_no))
                length = parse_length(tokens_in_interval(len_line["words"], left, right, marker.row_no))
                if not hose_id or length is None:
                    continue
                id_min, id_max = hose_id_bounds(hose_id)
                family_label, hose_type, size_band = family_label_for(marker.row_no, hose_id)
                hoses.append(
                    {
                        "partNo": word[4],
                        "hoseId": hose_id,
                        "length": length,
                        "rowNo": marker.row_no,
                        "idMin": id_min,
                        "idMax": id_max,
                        "catalogPage": page_no,
                        "familyLabel": family_label,
                        "hoseType": hose_type,
                        "sizeBand": size_band,
                        "imagePath": f"images/hoses/{word[4]}.png",
                    }
                )
                hose_crops.append(
                    HoseCrop(
                        part_no=word[4],
                        page_no=page_no,
                        row_no=marker.row_no,
                        left=left,
                        right=right,
                        band_top=band_top,
                        band_bottom=band_bottom,
                        part_top=part_line["y"] - 6,
                        len_bottom=len_line["y"] + 6,
                    )
                )
                row_count += 1

            group = row_groups.setdefault(
                marker.row_no,
                {
                    "rowNo": marker.row_no,
                    "catalogPage": page_no,
                    "count": 0,
                    "yTop": round(band_top, 2),
                    "yBottom": round(band_bottom, 2),
                    "families": Counter(),
                    "hoseTypes": Counter(),
                    "sizeBands": Counter(),
                    "idMin": math.inf,
                    "idMax": 0.0,
                },
            )
            group["count"] += row_count
            row_hoses = hoses[-row_count:] if row_count else []
            for hose in row_hoses:
                group["families"][hose["familyLabel"]] += 1
                group["hoseTypes"][hose["hoseType"]] += 1
                group["sizeBands"][hose["sizeBand"]] += 1
                if hose["idMin"] is not None:
                    group["idMin"] = min(group["idMin"], hose["idMin"])
                if hose["idMax"] is not None:
                    group["idMax"] = max(group["idMax"], hose["idMax"])

    hoses.sort(key=lambda hose: (hose["rowNo"], hose["partNo"]))
    rows = []
    for row_no in sorted(row_groups):
        group = row_groups[row_no]
        top_labels = [label for label, _ in group["families"].most_common(2)]
        rows.append(
            {
                "rowNo": row_no,
                "catalogPage": group["catalogPage"],
                "count": group["count"],
                "yTop": group["yTop"],
                "yBottom": group["yBottom"],
                "idMin": None if group["idMin"] == math.inf else round(group["idMin"], 2),
                "idMax": round(group["idMax"], 2),
                "familyLabel": top_labels[0] if top_labels else f"Shape row {row_no}",
                "familyLabels": top_labels,
                "hoseType": group["hoseTypes"].most_common(1)[0][0] if group["hoseTypes"] else "single",
                "sizeBand": group["sizeBands"].most_common(1)[0][0] if group["sizeBands"] else "bypass",
            }
        )
    return hoses, rows, hose_crops


def render_catalog_pages(doc: fitz.Document, output_dir: Path, dpi: int, quality: int) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    matrix = fitz.Matrix(dpi / 72, dpi / 72)
    for page_no in range(CATALOG_IMAGE_START, CATALOG_IMAGE_END + 1):
        out_path = output_dir / f"page-{page_no:03}.jpg"
        pix = doc[page_no - 1].get_pixmap(matrix=matrix, alpha=False)
        pix.save(out_path, jpg_quality=quality)


def extract_hose_images(doc: fitz.Document, crops: list[HoseCrop], output_dir: Path, dpi: int) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    matrix = fitz.Matrix(dpi / 72, dpi / 72)
    page_rects: dict[int, list[fitz.Rect]] = defaultdict(list)
    page_docs: dict[int, fitz.Page] = {}

    for crop in crops:
        if crop.page_no not in page_docs:
            page = doc[crop.page_no - 1]
            page_docs[crop.page_no] = page
            rects = []
            for xref, *_ in page.get_images(full=True):
                for rect in page.get_image_rects(xref):
                    if rect.width >= 6 and rect.height >= 18:
                        rects.append(rect)
            page_rects[crop.page_no] = rects

    written = 0
    for crop in crops:
        page = page_docs[crop.page_no]
        rects = []
        search_top = max(0, min(crop.band_top, crop.part_top - 150))
        for rect in page_rects[crop.page_no]:
            center_x = (rect.x0 + rect.x1) / 2
            center_y = (rect.y0 + rect.y1) / 2
            if crop.left <= center_x <= crop.right and search_top <= center_y <= crop.part_top:
                rects.append(rect)

        if rects:
            x0 = min(rect.x0 for rect in rects) - 4
            y0 = min(rect.y0 for rect in rects) - 4
            x1 = max(rect.x1 for rect in rects) + 4
            y1 = max(rect.y1 for rect in rects) + 20
        else:
            x0 = crop.left + 2
            y0 = max(0, crop.part_top - 140)
            x1 = crop.right - 2
            y1 = crop.len_bottom + 4

        clip = fitz.Rect(
            max(0, x0),
            max(0, y0),
            min(page.rect.width, x1),
            min(page.rect.height, y1),
        )
        if clip.width < 8 or clip.height < 16:
            continue

        pix = page.get_pixmap(matrix=matrix, clip=clip, alpha=False)
        out_path = output_dir / f"{crop.part_no}.png"
        pix.save(out_path)
        if out_path.stat().st_size > 400:
            written += 1
    return written


def verify(rows: list[dict], hoses: list[dict]) -> None:
    row_numbers = {row["rowNo"] for row in rows}
    expected = set(range(1, max(row_numbers) + 1)) if row_numbers else set()
    missing = sorted(expected - row_numbers)
    if missing:
        raise RuntimeError(f"Missing row numbers: {missing[:20]}")

    empty_rows = [row["rowNo"] for row in rows if row["count"] == 0]
    if empty_rows:
        raise RuntimeError(f"Rows extracted with zero parts: {empty_rows[:20]}")

    if not hoses:
        raise RuntimeError("No hose records were extracted")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract HoseFinder catalog data and page images from the Gates PDF.")
    parser.add_argument("--pdf", default="gates-molded-coolant-hose-id-guide-en.pdf")
    parser.add_argument("--data-dir", default="data")
    parser.add_argument("--images-dir", default="images/catalog")
    parser.add_argument("--hose-images-dir", default="images/hoses")
    parser.add_argument("--dpi", type=int, default=120)
    parser.add_argument("--quality", type=int, default=78)
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    data_dir = Path(args.data_dir)
    images_dir = Path(args.images_dir)
    hose_images_dir = Path(args.hose_images_dir)

    data_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    with fitz.open(pdf_path) as doc:
        hoses, rows, hose_crops = extract_rows(doc)
        verify(rows, hoses)

        (data_dir / "hoses.json").write_text(json.dumps(hoses, indent=2), encoding="utf-8")
        (data_dir / "rows.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")

        # Catalog metadata — surfaces a freshness badge in the UI footer.
        def parse_pdf_date(s: str) -> str:
            # PDF dates look like "D:20200214225318Z". Return ISO yyyy-mm-dd if parseable.
            if not s or not s.startswith("D:") or len(s) < 10:
                return ""
            try:
                return f"{s[2:6]}-{s[6:8]}-{s[8:10]}"
            except Exception:
                return ""

        from datetime import date
        md = doc.metadata or {}
        meta = {
            "title": md.get("title") or "Gates Molded Coolant Hose ID Guide",
            "source": Path(pdf_path).name,
            "pdfCreated": parse_pdf_date(md.get("creationDate", "")),
            "pdfModified": parse_pdf_date(md.get("modDate", "")),
            "extractedAt": date.today().isoformat(),
            "hoseCount": len(hoses),
        }
        (data_dir / "catalog-meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

        render_catalog_pages(doc, images_dir, args.dpi, args.quality)
        hose_image_count = extract_hose_images(doc, hose_crops, hose_images_dir, args.dpi)

    print(f"Extracted {len(hoses)} hoses across {len(rows)} rows")
    print(f"Wrote {data_dir / 'hoses.json'}")
    print(f"Wrote {data_dir / 'rows.json'}")
    print(f"Wrote {data_dir / 'catalog-meta.json'}")
    print(f"Rendered pages {CATALOG_IMAGE_START}-{CATALOG_IMAGE_END} into {images_dir}")
    print(f"Extracted {hose_image_count} hose images into {hose_images_dir}")


if __name__ == "__main__":
    main()
