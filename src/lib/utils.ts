import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely splits a string or array without ever throwing TypeError on null/undefined.
 * Returns [] when the value is not a valid non-empty string or array.
 */
export function safeSplit(value: unknown, separator: string | RegExp = ","): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.map((v) => (v !== null && v !== undefined ? String(v).trim() : "")).filter(Boolean);
  }
  if (typeof value !== "string") {
    const str = String(value).trim();
    return str ? str.split(separator).map((s) => s.trim()).filter(Boolean) : [];
  }
  if (!value.trim()) return [];
  return value.split(separator).map((s) => s.trim()).filter(Boolean);
}

/**
 * Safely extracts the first part of a string (e.g. first name, date part, time prefix)
 */
export function safeFirstPart(value: unknown, separator: string | RegExp = " ", fallback = ""): string {
  if (!value || typeof value !== "string") return fallback;
  const parts = value.split(separator);
  return parts[0] ? parts[0].trim() : fallback;
}
