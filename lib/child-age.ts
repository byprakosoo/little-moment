const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function dateFromInput(value: string | Date): Date | null {
  if (typeof value === "string") return parseDateOnly(value);
  if (Number.isNaN(value.getTime())) return null;
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}

function addYears(date: Date, years: number) {
  const targetYear = date.getUTCFullYear() + years;
  const targetMonth = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(date.getUTCDate(), lastDay)));
}

function addMonths(date: Date, months: number) {
  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(date.getUTCDate(), lastDay)));
}

export type ChildAge = { years: number; months: number; days: number };

export function getChildAge(birthDate: string, asOf: string | Date = new Date()): ChildAge {
  const birth = parseDateOnly(birthDate);
  const end = dateFromInput(asOf);
  if (!birth || !end || end < birth) return { years: 0, months: 0, days: 0 };

  let years = end.getUTCFullYear() - birth.getUTCFullYear();
  let anchor = addYears(birth, years);
  if (anchor > end) {
    years -= 1;
    anchor = addYears(birth, years);
  }

  let months = (end.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + end.getUTCMonth() - anchor.getUTCMonth();
  let monthAnchor = addMonths(anchor, months);
  if (monthAnchor > end) {
    months -= 1;
    monthAnchor = addMonths(anchor, months);
  }

  const days = Math.max(0, Math.round((end.getTime() - monthAnchor.getTime()) / DAY_MS));
  return { years, months, days };
}

export function formatChildAge(birthDate: string, asOf?: string | Date) {
  const { years, months, days } = getChildAge(birthDate, asOf);
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);
  if (days > 0 || parts.length === 0) parts.push(`${days} hari`);
  return parts.join(" ");
}
