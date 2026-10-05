import type { Currency } from "./types";

export function money(value: number, currency: Currency, compact = false): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    }).format(value || 0);
  } catch {
    return `${currency} ${Math.round(value || 0).toLocaleString()}`;
  }
}

export function shortDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00").getTime();
  const d2 = new Date(b + "T00:00:00").getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) return 0;
  return Math.round((d2 - d1) / 86400000);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso`. Weeks run Monday to Sunday. */
export function mondayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return addDays(iso, -((d.getDay() + 6) % 7));
}

export function weekLabel(start: string, end: string): string {
  const a = new Date(start + "T00:00:00");
  const b = new Date(end + "T00:00:00");
  const sameYear = a.getFullYear() === b.getFullYear();
  const fmt = (d: Date, year: boolean) =>
    d.toLocaleDateString("en", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
  return `${fmt(a, !sameYear)} – ${fmt(b, true)}`;
}
