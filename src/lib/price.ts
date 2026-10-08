/** Formats a number as Italian price with two decimals: 3.5 -> "3,50". */
export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parses user input accepting comma or dot: "3,5" -> 3.5. Returns null if invalid. */
export function parsePrice(input: string): number | null {
  const s = input.trim().replace(/\s|€/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (s === "") return 0;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
