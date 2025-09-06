from __future__ import annotations

import io
import json
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from werkzeug.datastructures import FileStorage


def _read_csv_bytes(file_bytes: bytes) -> pd.DataFrame:
    try:
        # Try to infer delimiter automatically
        return pd.read_csv(io.BytesIO(file_bytes), sep=None, engine="python")
    except Exception:
        # Fallback to utf-8 with comma delimiter
        return pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8", sep=",")


def _read_json_bytes(file_bytes: bytes) -> pd.DataFrame:
    try:
        return pd.read_json(io.BytesIO(file_bytes))
    except ValueError:
        # Try JSON Lines
        return pd.read_json(io.BytesIO(file_bytes), lines=True)


def load_dataframe_from_upload(file_storage: FileStorage) -> pd.DataFrame:
    """Load a pandas DataFrame from an uploaded CSV or JSON file.

    The parser attempts a few reasonable fallbacks for CSV delimiter and JSON lines.
    """
    filename = (file_storage.filename or "").lower()
    file_bytes = file_storage.read()

    if not file_bytes:
        raise ValueError("Uploaded file is empty")

    # Reset the stream pointer for any future consumers
    if hasattr(file_storage, "stream"):
        try:
            file_storage.stream.seek(0)
        except Exception:  # noqa: BLE001
            pass

    if filename.endswith(".csv"):
        return _read_csv_bytes(file_bytes)

    if filename.endswith(".json") or filename.endswith(".jsonl"):
        return _read_json_bytes(file_bytes)

    # If the extension is missing or unknown, try CSV first, then JSON
    try:
        return _read_csv_bytes(file_bytes)
    except Exception:  # noqa: BLE001
        return _read_json_bytes(file_bytes)


def clean_dataframe(dataframe: pd.DataFrame) -> pd.DataFrame:
    """Apply simple, conservative cleaning steps.

    - Drop rows that are entirely empty
    - Trim leading/trailing whitespace in object (string) columns
    - Normalize column names by stripping surrounding whitespace
    - Leave numeric missing values untouched (no imputation)
    """
    cleaned = dataframe.copy()

    # Normalize column names
    cleaned.columns = [str(col).strip() for col in cleaned.columns]

    # Drop fully empty rows
    cleaned = cleaned.dropna(how="all")

    # Trim strings in object columns
    for column_name in cleaned.select_dtypes(include=["object", "string"]).columns:
        cleaned[column_name] = cleaned[column_name].apply(
            lambda x: x.strip() if isinstance(x, str) else x
        )

    return cleaned


def summarize_dataframe(dataframe: pd.DataFrame) -> Dict[str, object]:
    """Produce a summary dictionary for display in the UI."""
    num_rows, num_columns = dataframe.shape

    column_summaries: List[Dict[str, object]] = []
    for column_name in dataframe.columns:
        series = dataframe[column_name]
        non_null_count = int(series.notna().sum())
        missing_count = int(series.isna().sum())
        dtype_str = str(series.dtype)

        # Generate small sample of up to 5 non-null unique values for display
        sample_values = (
            series.dropna().astype(str).unique().tolist()[:5]
            if non_null_count > 0
            else []
        )

        column_summary: Dict[str, object] = {
            "name": column_name,
            "dtype": dtype_str,
            "non_null": non_null_count,
            "missing": missing_count,
            "sample": sample_values,
        }

        if pd.api.types.is_numeric_dtype(series):
            desc = series.describe(percentiles=[0.25, 0.5, 0.75])
            column_summary["stats"] = {
                "count": _safe_float(desc.get("count")),
                "mean": _safe_float(desc.get("mean")),
                "std": _safe_float(desc.get("std")),
                "min": _safe_float(desc.get("min")),
                "p25": _safe_float(desc.get("25%")),
                "p50": _safe_float(desc.get("50%")),
                "p75": _safe_float(desc.get("75%")),
                "max": _safe_float(desc.get("max")),
            }

        column_summaries.append(column_summary)

    memory_usage_bytes = int(dataframe.memory_usage(index=True, deep=True).sum())

    return {
        "shape": {"rows": int(num_rows), "columns": int(num_columns)},
        "memory_bytes": memory_usage_bytes,
        "columns": column_summaries,
    }


def _safe_float(value: object) -> Optional[float]:
    try:
        if pd.isna(value):
            return None
        return float(value)  # type: ignore[return-value]
    except Exception:  # noqa: BLE001
        return None


def write_dataframe_to_csv(dataframe: pd.DataFrame, output_directory: Path) -> Tuple[Path, str]:
    output_directory.mkdir(parents=True, exist_ok=True)
    file_id = uuid.uuid4().hex
    file_path = output_directory / f"{file_id}.csv"
    dataframe.to_csv(file_path, index=False)
    return file_path, file_id

