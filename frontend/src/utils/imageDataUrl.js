export function normalizeBase64Image(value) {
  if (typeof value !== "string") return "";
  let text = value.trim();
  if (!text) return "";
  if (text.startsWith("data:") && text.includes("base64,")) {
    text = text.split("base64,", 2)[1].trim();
  }
  text = text.replace(/\s+/g, "");
  if (!text || /^\d+$/.test(text)) return "";
  return text;
}

export function guessImageMimeFromBase64(base64) {
  const b64 = normalizeBase64Image(base64);
  if (!b64) return "";
  const head = b64.slice(0, 16);

  if (head.startsWith("/9j/")) return "image/jpeg";
  if (head.startsWith("iVBORw0KGgo")) return "image/png";
  if (head.startsWith("R0lGOD")) return "image/gif";
  if (head.startsWith("UklGR")) return "image/webp";
  if (head.startsWith("PHN2Zy") || head.startsWith("PD94bW")) return "image/svg+xml";

  return "image/jpeg";
}

export function toImageDataUrl(base64) {
  if (typeof base64 !== "string") return "";
  const trimmed = base64.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;

  const b64 = normalizeBase64Image(trimmed);
  if (!b64) return "";

  const mime = guessImageMimeFromBase64(b64) || "image/jpeg";
  return `data:${mime};base64,${b64}`;
}

