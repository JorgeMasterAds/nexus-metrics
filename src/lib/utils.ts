import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a numeric string with Brazilian thousand separators (dots) */
export function formatValueInput(raw: string): string {
  // Keep only digits and comma (decimal separator)
  const clean = raw.replace(/[^\d,]/g, "");
  const [intPart, ...decParts] = clean.split(",");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decParts.length > 0 ? `${formatted},${decParts.join("")}` : formatted;
}

/** Parse a Brazilian-formatted value string to number */
export function parseValueInput(raw: string): number {
  const val = parseFloat(raw.replace(/\./g, "").replace(",", "."));
  return isNaN(val) ? 0 : val;
}
