import { db, id } from "./db";

/** What a comment hangs off: a drink or a menu session. */
export interface CommentParent {
  kind: "drink" | "menuSession";
  id: string;
}

/** Live comments of one parent, with their authors. */
export function useCommentsQuery(parent: () => CommentParent) {
  return db.useQuery(() => {
    const p = parent();
    // One query shape for both kinds keeps the result typed.
    const where: { "drink.id"?: string; "menuSession.id"?: string } =
      p.kind === "drink" ? { "drink.id": p.id } : { "menuSession.id": p.id };
    return { comments: { $: { where }, author: {} } };
  });
}

/** text must already be validated (see comments.ts validateComment). */
export function addComment(
  parent: CommentParent,
  participantId: string,
  text: string,
): Promise<unknown> {
  return db.transact(
    db.tx.comments[id()]
      .update({ text, createdAt: Date.now() })
      .link({ author: participantId, [parent.kind]: parent.id }),
  );
}

export function deleteComment(commentId: string): void {
  db.transact(db.tx.comments[commentId].delete());
}
