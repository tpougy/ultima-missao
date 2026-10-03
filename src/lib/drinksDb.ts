import { db, id } from "./db";
import type { DrinkData } from "./drinks";

/**
 * InstantDB side of the drinks page. Joining a group is a link
 * (drinks.members <-> participants.drinks), like menu likes.
 */

export function useDrinksQuery() {
  return db.useQuery({ drinks: { members: {}, createdBy: {} } });
}

/** The suggester joins their own drink's group right away. */
export function addDrink(
  participantId: string,
  name: string,
  description: string,
): Promise<unknown> {
  const fields = description
    ? { name, description, createdAt: Date.now() }
    : { name, createdAt: Date.now() };
  return db.transact(
    db.tx.drinks[id()]
      .update(fields)
      .link({ createdBy: participantId, members: participantId }),
  );
}

export function toggleMember(drink: DrinkData, participantId: string): void {
  const member = drink.members.some((p) => p.id === participantId);
  db.transact(
    member
      ? db.tx.drinks[drink.id].unlink({ members: participantId })
      : db.tx.drinks[drink.id].link({ members: participantId }),
  );
}

export function updateDrink(
  drinkId: string,
  patch: { name?: string; description?: string },
): void {
  db.transact(db.tx.drinks[drinkId].update(patch));
}

/** Its comments go too (cascade on the drinkComments link). */
export function deleteDrink(drinkId: string): void {
  db.transact(db.tx.drinks[drinkId].delete());
}
