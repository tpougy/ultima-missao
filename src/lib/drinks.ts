/**
 * Pure rules for the drinks page: anyone suggests a drink and others join
 * its group. Writes live in drinksDb.ts.
 */

export interface DrinkPerson {
  id: string;
  name: string;
}

export interface DrinkData {
  id: string;
  name: string;
  description?: string | null;
  createdAt: number;
  members: DrinkPerson[];
  createdBy?: DrinkPerson | null;
}

/** "  Vódka   Absolut " and "vodka absolut" are the same drink. */
export function normalizeDrinkName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** An existing drink with the same name, ignoring exceptId (when editing). */
export function findDuplicate<T extends DrinkData>(
  drinks: T[],
  name: string,
  exceptId?: string,
): T | null {
  const target = normalizeDrinkName(name);
  return (
    drinks.find(
      (drink) => drink.id !== exceptId && normalizeDrinkName(drink.name) === target,
    ) ?? null
  );
}

/** Biggest groups first; ties keep suggestion order. */
export function sortDrinks<T extends DrinkData>(drinks: T[]): T[] {
  return [...drinks].sort(
    (a, b) =>
      b.members.length - a.members.length ||
      a.createdAt - b.createdAt ||
      a.id.localeCompare(b.id),
  );
}
