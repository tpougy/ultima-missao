const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

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

export { toISODate, parseISODate };
