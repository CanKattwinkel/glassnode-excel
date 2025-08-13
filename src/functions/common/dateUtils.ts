// Common date transformation helpers for metrics

/** Convert Date to Unix timestamp (seconds) */
export function dateToUnixSeconds(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}

/** Convert unix seconds to Date */
export function unixSecondsToDate(sec: number): Date {
  return new Date(sec * 1000);
}

/** Convert unix seconds to YYYY-MM-DD (UTC) */
export function unixSecondsToYyyyMmDd(sec: number): string {
  return unixSecondsToDate(sec).toISOString().split('T')[0];
}
