/**
 * Pure rules for comment threads (on drinks and on menu sessions). Writes
 * live in commentsDb.ts.
 */

export const COMMENT_MAX = 1000;

export interface CommentData {
  id: string;
  text: string;
  createdAt: number;
  author?: { id: string; name: string } | null;
}

/** The text to store, or null when it can't be sent (blank or too long). */
export function validateComment(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length === 0 || trimmed.length > COMMENT_MAX ? null : trimmed;
}

/** Oldest first, so a thread reads top to bottom like a chat. */
export function sortComments<T extends CommentData>(comments: T[]): T[] {
  return [...comments].sort(
    (a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id),
  );
}

export function canDeleteComment(
  comment: CommentData,
  participantId: string,
  admin: boolean,
): boolean {
  return admin || comment.author?.id === participantId;
}
