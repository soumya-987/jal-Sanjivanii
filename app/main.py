from __future__ import annotations

import csv
import io
import json
import math
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


app = FastAPI(title="Data Processor", version="0.1.0")


if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", response_class=HTMLResponse)
async def index() -> FileResponse:
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(str(index_path))


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)) -> JSONResponse:
    try:
        filename = file.filename or "upload"
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        records = load_records_from_bytes(content, filename, file.content_type)
        rows_count = len(records)
        columns_set = set()
        for r in records:
            columns_set.update(r.keys())
        columns_count = len(columns_set)

        summary = generate_records_summary(records, list(columns_set))
        preview_rows = records[:50]

        payload: Dict[str, Any] = {
            "filename": filename,
            "rows": rows_count,
            "columns": columns_count,
            "summary": summary,
            "preview": preview_rows,
        }
        return JSONResponse(content=jsonable_encoder(payload))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {exc}") from exc

def load_records_from_bytes(data: bytes, filename: str, content_type: Optional[str]) -> List[Dict[str, Any]]:
    name_lower = filename.lower()
    if name_lower.endswith(".csv") or (content_type and "csv" in content_type):
        return _read_delimited(data, delimiter=",")
    if name_lower.endswith(".tsv") or (content_type and "tab-separated-values" in content_type):
        return _read_delimited(data, delimiter="\t")
    if name_lower.endswith(".json") or (content_type and "json" in content_type):
        return _read_json(data)
    raise ValueError("Unsupported file type. Please upload CSV, TSV, or JSON.")


def _read_delimited(data: bytes, delimiter: str) -> List[Dict[str, Any]]:
    text = data.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    return [dict(row) for row in reader]


def _read_json(data: bytes) -> List[Dict[str, Any]]:
    text = data.decode("utf-8", errors="replace").strip()
    if not text:
        return []
    # Try JSON Lines first
    lines = [ln for ln in text.splitlines() if ln.strip()]
    if len(lines) > 1 and all(ln.lstrip().startswith("{") for ln in lines[:5]):
        records: List[Dict[str, Any]] = []
        for ln in lines:
            obj = json.loads(ln)
            if isinstance(obj, dict):
                records.append(obj)
            else:
                records.append({"value": obj})
        return records
    # Otherwise try as a JSON array or single object
    obj = json.loads(text)
    if isinstance(obj, list):
        # list of dicts or primitives
        records = []
        for item in obj:
            if isinstance(item, dict):
                records.append(item)
            else:
                records.append({"value": item})
        return records
    if isinstance(obj, dict):
        return [obj]
    return [{"value": obj}]


def generate_records_summary(records: List[Dict[str, Any]], columns: List[str]) -> Dict[str, Any]:
    total_rows = len(records)
    missing_by_column: Dict[str, int] = {}
    columns_info: List[Dict[str, Any]] = []

    # Accumulate values per column
    values_by_column: Dict[str, List[Any]] = {c: [] for c in columns}
    for row in records:
        for c in columns:
            v = row.get(c, None)
            if v is not None and v != "":
                values_by_column[c].append(v)

    memory_usage_bytes = 0
    for c in columns:
        missing = total_rows - len(values_by_column[c])
        missing_by_column[c] = missing

    for c in columns:
        vals = values_by_column[c]
        # Estimate memory usage: bytes of UTF-8 string representations
        for v in vals:
            try:
                memory_usage_bytes += len(str(v).encode("utf-8"))
            except Exception:
                memory_usage_bytes += 8

        non_null_count = len(vals)
        unique_count = len({_hashable_or_str(v) for v in vals})
        inferred_dtype, numeric_values = _infer_dtype(vals)
        sample = [jsonable_python_value(v) for v in vals[:5]]

        column_info: Dict[str, Any] = {
            "name": c,
            "dtype": inferred_dtype,
            "non_null": non_null_count,
            "missing": missing_by_column[c],
            "unique": unique_count,
            "sample": sample,
        }

        if numeric_values:
            stats = _numeric_stats(numeric_values)
            column_info["stats"] = stats
        else:
            # Top values for non-numeric
            counts = Counter(str(v) for v in vals if v is not None and v != "")
            top = counts.most_common(5)
            column_info["top_values"] = [
                {"value": k, "count": int(n)} for k, n in top
            ]

        columns_info.append(column_info)

    return {
        "columns": columns_info,
        "missing_by_column": missing_by_column,
        "memory_usage_bytes": int(memory_usage_bytes),
    }


def _hashable_or_str(value: Any) -> Any:
    try:
        hash(value)
        return value
    except Exception:
        return json.dumps(value, default=str, ensure_ascii=False)


def _infer_dtype(values: List[Any]) -> Tuple[str, List[float]]:
    numeric_values: List[float] = []
    numeric_count = 0
    for v in values:
        # Already numeric
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            numeric_values.append(float(v))
            numeric_count += 1
            continue
        # Try to parse from string
        if isinstance(v, str):
            vv = v.strip().replace(",", "")
            try:
                numeric_values.append(float(vv))
                numeric_count += 1
                continue
            except Exception:
                pass
    inferred = "number" if numeric_count and numeric_count >= max(1, int(0.7 * len(values))) else "string"
    if inferred != "number":
        numeric_values = []
    return inferred, numeric_values


def _percentiles(sorted_values: List[float], ps: Iterable[float]) -> Dict[float, float]:
    n = len(sorted_values)
    out: Dict[float, float] = {}
    if n == 0:
        return {p: math.nan for p in ps}
    for p in ps:
        if p <= 0:
            out[p] = sorted_values[0]
            continue
        if p >= 1:
            out[p] = sorted_values[-1]
            continue
        idx = p * (n - 1)
        lo = int(math.floor(idx))
        hi = int(math.ceil(idx))
        if lo == hi:
            out[p] = sorted_values[lo]
        else:
            frac = idx - lo
            out[p] = sorted_values[lo] * (1 - frac) + sorted_values[hi] * frac
    return out


def _numeric_stats(values: List[float]) -> Dict[str, Optional[float]]:
    n = len(values)
    if n == 0:
        return {k: None for k in ["mean", "std", "min", "q1", "median", "q3", "max"]}
    s = sum(values)
    mean = s / n
    min_v = min(values)
    max_v = max(values)
    # Population standard deviation
    var = sum((x - mean) ** 2 for x in values) / n
    std = math.sqrt(var)
    sorted_vals = sorted(values)
    qs = _percentiles(sorted_vals, [0.25, 0.5, 0.75])
    return {
        "mean": float(mean),
        "std": float(std),
        "min": float(min_v),
        "q1": float(qs[0.25]),
        "median": float(qs[0.5]),
        "q3": float(qs[0.75]),
        "max": float(max_v),
    }


def jsonable_python_value(value: Any) -> Any:
    if value is None:
        return None
    return value


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

