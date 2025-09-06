const $ = (sel) => document.querySelector(sel);

const dropzone = $("#dropzone");
const fileInput = $("#fileInput");
const uploadBtn = $("#uploadBtn");
const statusEl = $("#status");
const resultsEl = $("#results");
const overviewEl = $("#overview");
const columnsTable = $("#columnsTable");
const previewTable = $("#previewTable");

let selectedFile = null;

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function humanFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function htmlEscape(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderOverview(payload) {
  const items = [
    ["File", payload.filename],
    ["Rows", payload.rows],
    ["Columns", payload.columns],
    ["Memory", humanFileSize(payload.summary?.memory_usage_bytes ?? 0)],
  ];
  overviewEl.innerHTML = items
    .map(([k, v]) => `<li><span>${htmlEscape(k)}</span><strong>${htmlEscape(v)}</strong></li>`) 
    .join("");
}

function renderColumnsTable(summary) {
  const rows = summary.columns || [];
  if (!rows.length) {
    columnsTable.innerHTML = "<tbody><tr><td>No columns</td></tr></tbody>";
    return;
  }
  const headers = ["Name", "Type", "Non-null", "Missing", "Unique", "Details"];
  const thead = `<thead><tr>${headers.map((h) => `<th>${htmlEscape(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map((col) => {
      let details = "";
      if (col.stats) {
        const s = col.stats;
        details = `mean=${s.mean ?? "-"}, std=${s.std ?? "-"}, min=${s.min ?? "-"}, q1=${s.q1 ?? "-"}, median=${s.median ?? "-"}, q3=${s.q3 ?? "-"}, max=${s.max ?? "-"}`;
      } else if (col.top_values) {
        details = col.top_values
          .map((tv) => `${htmlEscape(tv.value)} (${tv.count})`)
          .join(", ");
      }
      return `<tr>
        <td>${htmlEscape(col.name)}</td>
        <td>${htmlEscape(col.dtype)}</td>
        <td>${htmlEscape(col.non_null)}</td>
        <td>${htmlEscape(col.missing)}</td>
        <td>${htmlEscape(col.unique)}</td>
        <td>${details}</td>
      </tr>`;
    })
    .join("")}</tbody>`;
  columnsTable.innerHTML = thead + tbody;
}

function renderPreviewTable(records) {
  if (!records || !records.length) {
    previewTable.innerHTML = "<tbody><tr><td>No data</td></tr></tbody>";
    return;
  }
  const columns = Array.from(
    records.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const thead = `<thead><tr>${columns.map((c) => `<th>${htmlEscape(c)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${records
    .map((row) => `<tr>${columns.map((c) => `<td>${htmlEscape(row[c] ?? "")}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  previewTable.innerHTML = thead + tbody;
}

async function processFile() {
  try {
    if (!selectedFile) {
      setStatus("Please select a file first.", "error");
      return;
    }
    setStatus("Uploading and processing...", "info");
    uploadBtn.disabled = true;

    const form = new FormData();
    form.append("file", selectedFile, selectedFile.name);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        throw new Error(await res.text() || `HTTP ${res.status}`);
      }
      const data = await res.json();
      renderOverview(data);
      renderColumnsTable(data.summary);
      renderPreviewTable(data.preview);
      resultsEl.classList.remove("hidden");
      setStatus("Done (server)", "success");
      return;
    } catch (_) {
      // Fallback to local processing in the browser
      setStatus("Server unavailable, processing locally...", "info");
      const local = await processLocally(selectedFile);
      renderOverview(local);
      renderColumnsTable(local.summary);
      renderPreviewTable(local.preview);
      resultsEl.classList.remove("hidden");
      setStatus("Done (local)", "success");
    }
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message || err}`, "error");
  } finally {
    uploadBtn.disabled = false;
  }
}

// Wire up file selection
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0] || null;
  if (selectedFile) setStatus(`Selected: ${selectedFile.name}`);
});

["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("drag");
  })
);

["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("drag");
  })
);

dropzone.addEventListener("drop", (e) => {
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    selectedFile = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files;
    setStatus(`Selected: ${selectedFile.name}`);
  }
});

uploadBtn.addEventListener("click", processFile);

// ---------------- Local processing fallback ----------------

async function processLocally(file) {
  const text = await readFileAsText(file);
  const filename = file.name || "upload";
  let records = [];
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    records = parseCSV(text, ",");
  } else if (lower.endsWith(".tsv")) {
    records = parseCSV(text, "\t");
  } else if (lower.endsWith(".json")) {
    records = parseJSONFlexible(text);
  } else {
    // Heuristic: try JSON first, else CSV
    try { records = parseJSONFlexible(text); } catch { records = parseCSV(text, ","); }
  }
  const summary = generateSummary(records);
  return {
    filename,
    rows: records.length,
    columns: Object.keys(summary.missing_by_column || {}).length,
    summary,
    preview: records.slice(0, 50),
  };
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function parseJSONFlexible(text) {
  const t = (text || "").trim();
  if (!t) return [];
  const lines = t.split(/\r?\n/).filter((ln) => ln.trim());
  if (lines.length > 1 && lines.slice(0, Math.min(5, lines.length)).every((ln) => ln.trim().startsWith("{"))) {
    const out = [];
    for (const ln of lines) {
      const obj = JSON.parse(ln);
      out.push(typeof obj === "object" && obj !== null ? obj : { value: obj });
    }
    return out;
  }
  const obj = JSON.parse(t);
  if (Array.isArray(obj)) return obj.map((x) => (typeof x === "object" && x !== null ? x : { value: x }));
  if (typeof obj === "object" && obj !== null) return [obj];
  return [{ value: obj }];
}

function parseCSV(text, delimiter) {
  const rows = [];
  const current = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => { current.push(field); field = ""; };
  const pushRow = () => { rows.push(current.slice()); current.length = 0; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote
        if (i + 1 < text.length && text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === delimiter) { pushField(); }
      else if (ch === '\n') { pushField(); pushRow(); }
      else if (ch === '\r') {
        // ignore, will handle by \n
      } else { field += ch; }
    }
  }
  // flush last field/row
  pushField();
  if (current.length > 1 || field.length > 0 || rows.length === 0) pushRow();
  // Use first row as header
  if (!rows.length) return [];
  const header = rows[0].map((h, idx) => (h && String(h).trim()) || `col_${idx + 1}`);
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === "") continue; // skip empty lines
    const obj = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = row[c] ?? "";
    }
    out.push(obj);
  }
  return out;
}

function generateSummary(records) {
  const columns = Array.from(records.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set()));
  const total = records.length;
  const valuesByCol = {};
  columns.forEach((c) => valuesByCol[c] = []);
  for (const r of records) {
    for (const c of columns) {
      const v = r[c];
      if (v !== null && v !== undefined && v !== "") valuesByCol[c].push(v);
    }
  }
  let memory = 0;
  for (const c of columns) {
    for (const v of valuesByCol[c]) {
      try { memory += new Blob([String(v)]).size; } catch { memory += String(v).length; }
    }
  }

  const columnsInfo = [];
  const missingByColumn = {};
  for (const c of columns) {
    const vals = valuesByCol[c];
    missingByColumn[c] = total - vals.length;
    const { isNumeric, numericValues } = coerceNumeric(vals);
    const unique = new Set(vals.map((v) => String(v))).size;
    const info = { name: c, dtype: isNumeric ? "number" : "string", non_null: vals.length, missing: missingByColumn[c], unique, sample: vals.slice(0, 5) };
    if (isNumeric) info.stats = numericStats(numericValues);
    else {
      const counts = new Map();
      for (const v of vals) counts.set(String(v), (counts.get(String(v)) || 0) + 1);
      const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([value, count]) => ({ value, count }));
      info.top_values = top;
    }
    columnsInfo.push(info);
  }

  return { columns: columnsInfo, missing_by_column: missingByColumn, memory_usage_bytes: memory };
}

function coerceNumeric(values) {
  const nums = [];
  let numericCount = 0;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) { nums.push(v); numericCount++; continue; }
    const s = String(v).trim().replace(/,/g, "");
    const n = Number(s);
    if (!Number.isNaN(n) && Number.isFinite(n)) { nums.push(n); numericCount++; }
  }
  const isNumeric = numericCount >= Math.max(1, Math.floor(0.7 * values.length));
  return { isNumeric, numericValues: isNumeric ? nums : [] };
}

function numericStats(values) {
  const n = values.length;
  if (!n) return { mean: null, std: null, min: null, q1: null, median: null, q3: null, max: null };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
  const std = Math.sqrt(variance);
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const median = percentile(sorted, 0.5);
  const q3 = percentile(sorted, 0.75);
  return { mean, std, min, q1, median, q3, max };
}

function percentile(sorted, p) {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (p <= 0) return sorted[0];
  if (p >= 1) return sorted[n - 1];
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const frac = idx - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

