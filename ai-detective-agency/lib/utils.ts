// ============================================================
// General utilities — lib/utils.ts
// ============================================================

import { type ClassValue, clsx } from "clsx";

// ---------------------------------------------------------------------------
// Class name utility (works without tailwind-merge if not installed)
// ---------------------------------------------------------------------------

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

export function generateId(prefix = ""): string {
  const random = Math.random().toString(36).slice(2, 9);
  const ts = Date.now().toString(36);
  return prefix ? `${prefix}_${ts}${random}` : `${ts}${random}`;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function formatDate(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

export function truncate(str: string, maxLength: number, suffix = "…"): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

export function createApiError(message: string, status = 500) {
  return Response.json({ success: false, error: message }, { status });
}

export function createApiSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable "${key}" is not set.`);
  }
  return value;
}

export const isDev = process.env.NODE_ENV === "development";
export const isProd = process.env.NODE_ENV === "production";
