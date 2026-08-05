export interface Participant {
  id: string;
  name: string;
}

const STORAGE_KEY = "um_participant";

export function getParticipant(): Participant | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Participant>;
    if (!parsed.id) return null;
    return { id: parsed.id, name: parsed.name ?? "" };
  } catch {
    return null;
  }
}

export function saveParticipantName(name: string): Participant {
  const existing = getParticipant();
  const participant: Participant = {
    id: existing?.id ?? crypto.randomUUID(),
    name: name.trim(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(participant));
  return participant;
}

export function forgetParticipantName(): void {
  const existing = getParticipant();
  if (!existing) return;
  // Keep the id so past votes stay attributed to the same person; only the
  // display name is cleared, which brings the name gate back up.
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ id: existing.id, name: "" }),
  );
}
