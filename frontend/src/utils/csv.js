const BOM = "\uFEFF";

const normalizeHeader = (value) =>
  String(value || "")
    .replace(/\uFEFF/g, "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const escapeValue = (value, delimiter) => {
  const raw = value === null || value === undefined ? "" : String(value);
  const escaped = raw.replace(/"/g, '""');
  if (escaped.includes(delimiter) || /[\r\n]/.test(escaped) || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
};

export const buildCsv = ({ columns, rows, delimiter = ";" }) => {
  const header = columns.map((c) => escapeValue(c.label ?? c.key, delimiter)).join(delimiter);
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const value = typeof c.format === "function" ? c.format(row[c.key], row) : row[c.key];
        return escapeValue(value, delimiter);
      })
      .join(delimiter),
  );
  return [header, ...body].join("\r\n");
};

const defaultDelimiter = () => {
  if (typeof Intl !== "undefined" && Intl.NumberFormat) {
    const sample = new Intl.NumberFormat().format(1.1);
    if (sample.includes(",")) return ";";
  }
  if (typeof navigator !== "undefined") {
    const lang = String(navigator.language || "");
    if (lang.startsWith("es") || lang.startsWith("pt") || lang.startsWith("fr")) return ";";
  }
  return ",";
};

export const downloadCsv = ({ filename, columns, rows, delimiter }) => {
  const effectiveDelimiter = delimiter || defaultDelimiter();
  const csv = buildCsv({ columns, rows, delimiter: effectiveDelimiter });
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const detectDelimiter = (text) => {
  const firstLine = (text || "").split(/\r?\n/).find((line) => line.trim().length);
  if (!firstLine) return ",";
  const comma = (firstLine.match(/,/g) || []).length;
  const semi = (firstLine.match(/;/g) || []).length;
  return semi > comma ? ";" : ",";
};

export const parseCsvText = (text, delimiter) => {
  const delim = delimiter || detectDelimiter(text);
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };

  const pushRow = () => {
    if (row.length || cell.length) {
      pushCell();
      rows.push(row);
      row = [];
    }
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && char === delim) {
      pushCell();
      continue;
    }
    if (!inQuotes && char === "\n") {
      pushRow();
      continue;
    }
    if (!inQuotes && char === "\r") {
      if (next === "\n") i += 1;
      pushRow();
      continue;
    }
    cell += char;
  }

  pushRow();

  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c || "").trim().length));
  return { headers, rows: dataRows };
};

export const parseCsvFile = async (file) => {
  const text = await file.text();
  return parseCsvText(text);
};

export const mapCsvRows = (headers, rows, fieldMap, options = {}) => {
  const normalized = headers.map(normalizeHeader);
  const indices = {};
  Object.entries(fieldMap).forEach(([field, candidates]) => {
    const opts = Array.isArray(candidates) ? candidates : [candidates];
    const idx = normalized.findIndex((h) => opts.map(normalizeHeader).includes(h));
    indices[field] = idx;
  });

  const defaults = options.defaults || {};
  return rows.map((row, index) => {
    const obj = { ...defaults };
    Object.entries(indices).forEach(([field, idx]) => {
      if (idx >= 0) obj[field] = row[idx];
    });
    return typeof options.transform === "function" ? options.transform(obj, index) : obj;
  });
};
