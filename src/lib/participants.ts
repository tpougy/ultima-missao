import { db, id } from "./db";
import type { InstaQLEntity } from "@instantdb/svelte";
import type { AppSchema } from "../../instant.schema";

export type Participant = InstaQLEntity<AppSchema, "participants">;

export class NicknameTakenError extends Error {}

/**
 * Creates the participant for a freshly logged-in user and links it to
 * their $users row. Nicknames must be unique — checked client-side first
 * for a fast error, then enforced for real by the schema's unique
 * constraint in case two people submit the same nickname at once.
 */
export async function createParticipantForUser(
  userId: string,
  nickname: string,
): Promise<Participant> {
  const name = nickname.trim();
  const taken = () => new NicknameTakenError(`O apelido "${name}" já está em uso.`);
  const { data } = await db.queryOnce({
    participants: { $: { where: { name } } },
  });
  if (data.participants.length > 0) throw taken();

  const participantId = id();
  try {
    await db.transact(
      db.tx.participants[participantId].update({ name }).link({ user: userId }),
    );
  } catch {
    throw taken();
  }
  return { id: participantId, name };
}
