import { db, id } from "./db";
import type { InstaQLEntity } from "@instantdb/svelte";
import type { AppSchema } from "../../instant.schema";
import { buildMenu, type MenuItemData, type MenuState } from "./menu";

/**
 * InstantDB side of the menu voting: the shared query plus every write.
 * The rules themselves (who counts, what makes the menu, totals) live in
 * menu.ts so they stay pure and tested.
 */

/** Fixed id of the single menuSettings row, written with update (upsert). */
export const MENU_SETTINGS_ID = "cffbd3f1-4486-46db-88ef-2601c62f742a";

export type MenuSettings = InstaQLEntity<AppSchema, "menuSettings">;
type MenuSessionWithItems = InstaQLEntity<
  AppSchema,
  "menuSessions",
  { items: { likedBy: object } }
>;
type Participant = InstaQLEntity<AppSchema, "participants">;

/**
 * The one live query both menu pages use: everyone sees the same voters,
 * scores and totals, recomputed whenever anyone joins, leaves or votes.
 * Must be called during component initialisation (it's a db.useQuery).
 */
export function useMenuQuery() {
  return db.useQuery({
    menuSettings: { $: { where: { id: MENU_SETTINGS_ID } } },
    menuSessions: { items: { likedBy: {} } },
    participants: {},
  });
}

export interface MenuData {
  settings: MenuSettings | null;
  participants: Participant[];
  state: MenuState;
}

export function readMenu(
  data:
    | {
        menuSettings: MenuSettings[];
        menuSessions: MenuSessionWithItems[];
        participants: Participant[];
      }
    | undefined,
): MenuData {
  const settings = data?.menuSettings[0] ?? null;
  const participants = data?.participants ?? [];
  return {
    settings,
    participants,
    state: buildMenu({
      sessions: data?.menuSessions ?? [],
      participants,
      arrival: settings?.arrivalDate,
      departure: settings?.departureDate,
    }),
  };
}

export function updateMenuSettings(patch: {
  payingCount?: number;
  arrivalDate?: string;
  departureDate?: string;
}): void {
  db.transact(db.tx.menuSettings[MENU_SETTINGS_ID].update(patch));
}

/** Opt in (true) or out (false). Opting out keeps likes stored but ignored. */
export function setMenuVoter(participantId: string, value: boolean): void {
  db.transact(db.tx.participants[participantId].update({ menuVoter: value }));
}

export function toggleLike(item: MenuItemData, participantId: string): void {
  const liked = item.likedBy.some((p) => p.id === participantId);
  db.transact(
    liked
      ? db.tx.menuItems[item.id].unlink({ likedBy: participantId })
      : db.tx.menuItems[item.id].link({ likedBy: participantId }),
  );
}

/** date = null creates a session in the "Geral" card. */
export function addSession(
  date: string | null,
  name: string,
  order: number,
): void {
  db.transact(
    db.tx.menuSessions[id()].update(date ? { name, order, date } : { name, order }),
  );
}

export function renameSession(sessionId: string, name: string): void {
  db.transact(db.tx.menuSessions[sessionId].update({ name }));
}

/** Cascade on the session<->items link deletes their items (and likes). */
export function deleteSessions(sessionIds: string[]): void {
  if (sessionIds.length === 0) return;
  db.transact(sessionIds.map((sid) => db.tx.menuSessions[sid].delete()));
}

export interface MenuItemFields {
  name: string;
  price: number;
  quantity: string;
  description: string;
}

export function addItem(
  sessionId: string,
  fields: MenuItemFields,
  order: number,
): void {
  db.transact(
    db.tx.menuItems[id()]
      .update({ ...fields, order })
      .link({ session: sessionId }),
  );
}

export function updateItem(
  itemId: string,
  patch: Partial<MenuItemFields>,
): void {
  db.transact(db.tx.menuItems[itemId].update(patch));
}

export function deleteItem(itemId: string): void {
  db.transact(db.tx.menuItems[itemId].delete());
}

/** Writes the order changes produced by menu.ts reorder() in one transaction. */
export function applyOrder(
  entity: "menuSessions" | "menuItems",
  updates: { id: string; order: number }[],
): void {
  if (updates.length === 0) return;
  db.transact(updates.map((u) => db.tx[entity][u.id].update({ order: u.order })));
}
