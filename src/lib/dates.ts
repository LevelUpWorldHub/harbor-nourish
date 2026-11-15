const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Treat stored timestamps as UTC so tests and the demo clock do not shift by timezone. */
export function ensureUtc(iso: string): string {
  if (iso.endsWith("Z")) return iso;
  if (iso.length === 10) return `${iso}T00:00:00Z`;
  return `${iso}Z`;
}

export function parseMs(iso: string): number {
  return Date.parse(ensureUtc(iso));
}

export function dayKey(iso: string): string {
  return ensureUtc(iso).slice(0, 10);
}

export function addHoursIso(iso: string, hours: number): string {
  return new Date(parseMs(iso) + hours * 3_600_000).toISOString().slice(0, 19);
}

export function addDaysKey(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export function hoursBetween(earlier: string, later: string): number {
  return (parseMs(later) - parseMs(earlier)) / 3_600_000;
}

export function formatWhen(iso: string): string {
  const utc = ensureUtc(iso);
  const [y, m, d] = utc.slice(0, 10).split("-").map(Number);
  const date = `${MONTHS[m - 1]} ${d}, ${y}`;
  if (iso.length === 10) return date;
  const [hh, mm] = utc.slice(11, 16).split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${date}, ${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}

export function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}
