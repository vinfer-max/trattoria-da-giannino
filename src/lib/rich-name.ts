/** Plain labels for search, selectors, slugs and alternative text. */
export function plainName(value: string): string {
  return value.replace(/<[^>]*>/g, " ")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (entity, code: string) => {
      const n = code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : Number(code);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : entity;
    })
    .replace(/&(nbsp|amp|lt|gt|quot|apos);/g, (_, key: string) => ({ nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[key] ?? "")
    .replace(/\s+/g, " ").trim();
}

/** Existing plain names must not be interpreted as HTML by the editor. */
export function nameEditorContent(value: string): string {
  if (/<\/?(?:p|span|strong|em|u|s|h[1-6]|ul|ol|li|blockquote|a|br)\b/i.test(value)) return value;
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}