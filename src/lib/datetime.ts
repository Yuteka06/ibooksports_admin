/**
 * The API sends times as ISO 8601 (UTC). The admin panel shows them in India time.
 * Older values that are already display text are shown as they are.
 */
const IST = 'Asia/Kolkata';

const parse = (value?: string | null): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/** "21 Oct 2026, 11:03 AM" */
export function formatIstDateTime(value?: string | null): string {
  const d = parse(value);
  if (!d) return value || '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/** "2026-10-21" (the India date, also for times between midnight and 05:30 AM IST) */
export function formatIstDate(value?: string | null): string {
  const d = parse(value);
  if (!d) return (value || '').split(' ')[0];
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
