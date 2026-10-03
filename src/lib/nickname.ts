/**
 * Nickname rules: shown as typed (minus stray spaces), but unique ignoring
 * case and accents, so "Thomaz" and "thómaz" can't both exist.
 */

/** The nickname to display: trimmed, inner whitespace collapsed. */
export function cleanNickname(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Uniqueness key stored in participants.nameKey (unique in the schema). */
export function nicknameKey(name: string): string {
  return cleanNickname(name)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
