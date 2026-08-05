import { db, id } from "./db";
import type { InstaQLEntity } from "@instantdb/svelte";
import type { AppSchema } from "../../instant.schema";

export type WeekendWithVotes = InstaQLEntity<
  AppSchema,
  "weekends",
  { votes: object }
>;
export type Vote = InstaQLEntity<AppSchema, "votes">;

export type ArrivalType = "friday" | "saturday";

/**
 * Casts, changes, or clears a participant's vote for a weekend.
 * Clicking the option that's already selected clears the vote (leaves the
 * card unanswered); otherwise it upserts to the chosen option. The vote id
 * is looked up client-side from the already-subscribed query, which is what
 * guarantees exactly one vote per participant per weekend.
 */
export function castVote(
  weekend: WeekendWithVotes,
  participantId: string,
  participantName: string,
  arrivalType: ArrivalType,
): void {
  const existing = weekend.votes.find(
    (v) => v.participantId === participantId,
  );

  if (existing && existing.arrivalType === arrivalType) {
    db.transact(db.tx.votes[existing.id].delete());
    return;
  }

  if (existing) {
    db.transact(
      db.tx.votes[existing.id].update({ arrivalType, participantName }),
    );
    return;
  }

  const voteId = id();
  db.transact(
    db.tx.votes[voteId]
      .update({ participantId, participantName, arrivalType })
      .link({ weekend: weekend.id }),
  );
}

/**
 * Keeps past votes' denormalized participantName in sync after a rename, so
 * the attendee list in the admin panel doesn't show a stale name.
 */
export async function syncParticipantNameAcrossVotes(
  participantId: string,
  newName: string,
): Promise<void> {
  const { data } = await db.queryOnce({
    votes: { $: { where: { participantId } } },
  });
  const steps = (data.votes as Vote[]).map((v) =>
    db.tx.votes[v.id].update({ participantName: newName }),
  );

  if (steps.length > 0) {
    db.transact(steps);
  }
}
