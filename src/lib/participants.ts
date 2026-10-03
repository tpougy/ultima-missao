import { db, id } from "./db";
import type { InstaQLEntity } from "@instantdb/svelte";
import type { AppSchema } from "../../instant.schema";
import { cleanNickname, nicknameKey } from "./nickname";

export type Participant = InstaQLEntity<AppSchema, "participants">;

export class NicknameTakenError extends Error {}

/**
 * Creates the participant for a freshly logged-in user and links it to
 * their $users row. Nicknames must be unique ignoring case and accents —
 * checked client-side first for a fast error, then enforced for real by
 * the schema's unique nameKey in case two people submit at once.
 */
export async function createParticipantForUser(
  userId: string,
  nickname: string,
): Promise<Participant> {
  const name = cleanNickname(nickname);
  const nameKey = nicknameKey(name);
  const taken = () => new NicknameTakenError(`O apelido "${name}" já está em uso.`);
  const { data } = await db.queryOnce({
    participants: { $: { where: { nameKey } } },
  });
  if (data.participants.length > 0) throw taken();

  const participantId = id();
  try {
    await db.transact(
      db.tx.participants[participantId]
        .update({ name, nameKey })
        .link({ user: userId }),
    );
  } catch {
    throw taken();
  }
  return { id: participantId, name };
}
