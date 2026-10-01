import { addDays, parseISODate, toISODate } from "./dates";

/**
 * Pure menu-voting rules: no InstantDB here, so everything is unit-tested
 * (tests/menu.test.ts). The components feed the live query result into
 * buildMenu and only render what comes out.
 *
 * Shapes are structural on purpose: they match the InstaQL entities for
 * participants/menuSessions/menuItems without importing the schema.
 */

export interface MenuPerson {
  id: string;
  name: string;
  /** undefined/null = never answered the opt-in, false = just watching. */
  menuVoter?: boolean | null;
}

export interface MenuItemData {
  id: string;
  name: string;
  /** Total cost of the item (not per person). */
  price: number;
  quantity?: string | null;
  description?: string | null;
  order: number;
  likedBy: MenuPerson[];
}

export interface MenuSessionData {
  id: string;
  name: string;
  order: number;
  /** ISO date of the trip day; absent for the "Geral" card. */
  date?: string | null;
  items: MenuItemData[];
}

export interface ScoredItem {
  item: MenuItemData;
  /** How many current voters want this item. */
  support: number;
  inMenu: boolean;
  /** Current voters who want this item. */
  likers: MenuPerson[];
}

export interface MenuSessionView {
  session: MenuSessionData;
  items: ScoredItem[];
}

export interface MenuCard {
  key: string;
  /** null for the "Geral" card. */
  date: string | null;
  sessions: MenuSessionView[];
}

export interface MenuState {
  days: string[];
  /** "Geral" first, then one card per trip day (possibly without sessions). */
  cards: MenuCard[];
  voters: MenuPerson[];
  /** Sum of the prices of every item currently in the menu. */
  total: number;
}

/** Guards against a typo (e.g. wrong year) rendering hundreds of day cards. */
export const MAX_TRIP_DAYS = 62;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function tripDays(
  arrival?: string | null,
  departure?: string | null,
): string[] {
  if (!arrival || !departure) return [];
  if (!ISO_DATE.test(arrival) || !ISO_DATE.test(departure)) return [];
  if (arrival > departure) return [];

  const days: string[] = [];
  let current = parseISODate(arrival);
  const last = toISODate(parseISODate(departure));

  while (days.length <= MAX_TRIP_DAYS) {
    const iso = toISODate(current);
    days.push(iso);
    if (iso === last) return days;
    current = addDays(current, 1);
  }
  return [];
}

/** An item makes the menu when at least half of the voters want it. */
export function isInMenu(support: number, voterCount: number): boolean {
  return voterCount > 0 && support * 2 >= voterCount;
}

/** Stable ordering: by `order`, ties (concurrent creations) broken by id. */
export function sortByOrder<T extends { id: string; order: number }>(
  list: T[],
): T[] {
  return list
    .slice()
    .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function nextOrder(list: { order: number }[]): number {
  if (list.length === 0) return 0;
  return Math.max(...list.map((x) => x.order)) + 1;
}

/**
 * Moves sorted[index] one step up (-1) or down (1). Renumbers the list as
 * 0..n-1 so tied orders can't make a move a no-op, and returns only the
 * entries whose order actually changed (to write in a single transaction).
 */
export function reorder<T extends { id: string; order: number }>(
  sorted: T[],
  index: number,
  dir: -1 | 1,
): { id: string; order: number }[] {
  const target = index + dir;
  if (index < 0 || index >= sorted.length) return [];
  if (target < 0 || target >= sorted.length) return [];

  const ids = sorted.map((x) => x.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];

  const current = new Map(sorted.map((x) => [x.id, x.order]));
  return ids
    .map((id, order) => ({ id, order }))
    .filter(({ id, order }) => current.get(id) !== order);
}

export function buildMenu(input: {
  sessions: MenuSessionData[];
  participants: MenuPerson[];
  arrival?: string | null;
  departure?: string | null;
}): MenuState {
  const days = tripDays(input.arrival, input.departure);
  const voters = input.participants.filter((p) => p.menuVoter === true);
  const voterIds = new Set(voters.map((p) => p.id));

  const cards: MenuCard[] = [
    { key: "geral", date: null, sessions: [] },
    ...days.map((date) => ({ key: date, date, sessions: [] })),
  ];
  const cardByDate = new Map(cards.map((c) => [c.date ?? "", c]));

  let total = 0;
  for (const session of sortByOrder(input.sessions)) {
    const card = cardByDate.get(session.date ?? "");
    if (!card) continue; // dated outside the current trip period

    const items = sortByOrder(session.items).map((item): ScoredItem => {
      const likers = item.likedBy.filter((p) => voterIds.has(p.id));
      const support = likers.length;
      const inMenu = isInMenu(support, voters.length);
      if (inMenu) total += item.price;
      return { item, support, inMenu, likers };
    });
    card.sessions.push({ session, items });
  }

  return { days, cards, voters, total };
}

/** Per-person cost, computed only for display; null when there are no payers. */
export function perPerson(
  total: number,
  paying?: number | null,
): number | null {
  if (!paying || paying <= 0) return null;
  return total / paying;
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number): string {
  return BRL.format(value);
}

/**
 * Parses a price typed in the admin ("80", "12,50", "1.234,56", "R$ 80").
 * Returns null for anything that isn't a non-negative amount, so the input
 * can be reverted instead of saving NaN or a negative cost.
 */
export function parsePrice(raw: string): number | null {
  let text = raw.trim().replace(/^R\$\s*/, "");
  if (text === "") return null;
  if (text.includes(",")) {
    // Brazilian format: dots group thousands, the comma is the decimal mark.
    text = text.replace(/\./g, "").replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Math.round(Number(text) * 100) / 100;
}

export function parsePayingCount(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
}
