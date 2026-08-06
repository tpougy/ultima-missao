const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
// Monday-first, to match the month grid (weeks run Mon..Sun there).
export const WEEKDAY_INITIALS = ["S", "T", "Q", "Q", "S", "S", "D"];

const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Parses a "YYYY-MM-DD" string as a local date, avoiding UTC-parsing off-by-one bugs. */
function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export interface WeekendDates {
  friday: Date;
  saturday: Date;
  sunday: Date;
}

export function weekendFromFriday(fridayISO: string): WeekendDates {
  const friday = parseISODate(fridayISO);
  return {
    friday,
    saturday: addDays(friday, 1),
    sunday: addDays(friday, 2),
  };
}

export function dayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

export function dayNumber(date: Date): number {
  return date.getDate();
}

/** Full month name, capitalized (e.g. "Agosto"). */
function monthLabel(date: Date): string {
  const label = MONTH_LABELS[date.getMonth()];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Label for the month(s) a weekend spans, e.g. "Agosto" or, when the
 * weekend crosses a month boundary, "Agosto/Setembro".
 */
export function weekendMonthLabel({ friday, sunday }: WeekendDates): string {
  if (friday.getMonth() === sunday.getMonth()) {
    return monthLabel(friday);
  }
  return `${monthLabel(friday)}/${monthLabel(sunday)}`;
}

/** 0=Monday..6=Sunday, unlike Date#getDay's 0=Sunday..6=Saturday. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export { toISODate, parseISODate, addDays, monthLabel };
