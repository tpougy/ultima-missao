import { db, id } from "./db";
import type { InstaQLEntity } from "@instantdb/svelte";
import type { AppSchema } from "../../instant.schema";

export type Participant = InstaQLEntity<AppSchema, "participants">;

const STORAGE_KEY = "um_participant_id";

export function getStoredParticipantId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredParticipantId(participantId: string): void {
  localStorage.setItem(STORAGE_KEY, participantId);
}

export function clearStoredParticipantId(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export class NameTakenError extends Error {}

/**
 * Creates a new participant. Names double as cross-device identity (see
 * IdentityGate.svelte), so they must be unique — checked client-side first
 * for a fast error, then enforced for real by the schema's unique
 * constraint in case two people submit the same name at once.
 */
export async function createParticipant(name: string): Promise<Participant> {
  const trimmed = name.trim();
  const { data } = await db.queryOnce({
    participants: { $: { where: { name: trimmed } } },
  });
  if (data.participants.length > 0) {
    throw new NameTakenError(`O nome "${trimmed}" já está em uso.`);
  }

  const participantId = id();
  try {
    await db.transact(
      db.tx.participants[participantId].update({ name: trimmed }),
    );
  } catch {
    throw new NameTakenError(`O nome "${trimmed}" já está em uso.`);
  }
  return { id: participantId, name: trimmed };
}
