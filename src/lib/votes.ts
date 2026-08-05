import { db, id } from "./db";
import type { InstaQLEntity } from "@instantdb/svelte";
import type { AppSchema } from "../../instant.schema";

export type VoteWithParticipant = InstaQLEntity<
  AppSchema,
  "votes",
  { participant: object }
>;
export type WeekendWithVotes = InstaQLEntity<
  AppSchema,
  "weekends",
  { votes: { participant: object } }
>;

export type ArrivalType = "friday" | "saturday";

function findVote(weekend: WeekendWithVotes, participantId: string) {
  return weekend.votes.find((v) => v.participant?.id === participantId);
}

/**
 * Casts or changes a participant's vote for a weekend. The vote id is
 * looked up client-side from the already-subscribed query (via the
 * votes<->participants link), which is what guarantees exactly one vote per
 * participant per weekend.
 */
export function castVote(
  weekend: WeekendWithVotes,
  participantId: string,
  arrivalType: ArrivalType,
): void {
  const existing = findVote(weekend, participantId);

  if (existing && existing.arrivalType === arrivalType) {
    db.transact(db.tx.votes[existing.id].delete());
    return;
  }

  if (existing) {
    db.transact(db.tx.votes[existing.id].update({ arrivalType }));
    return;
  }

  const voteId = id();
  db.transact(
    db.tx.votes[voteId]
      .update({ arrivalType })
      .link({ weekend: weekend.id, participant: participantId }),
  );
}

/** Explicitly clears a participant's vote for a weekend, if any. */
export function removeVote(
  weekend: WeekendWithVotes,
  participantId: string,
): void {
  const existing = findVote(weekend, participantId);
  if (existing) {
    db.transact(db.tx.votes[existing.id].delete());
  }
}

/** Deletes every vote cast for a weekend, keeping the weekend itself. */
export function resetWeekendVotes(weekend: WeekendWithVotes): void {
  if (weekend.votes.length === 0) return;
  db.transact(weekend.votes.map((v) => db.tx.votes[v.id].delete()));
}

/**
 * How a weekend's turnout compares to the busiest one in the list (0..1).
 * Shared by the cards and the month overview so both agree on "how green".
 */
export function heatRatio(
  weekend: WeekendWithVotes,
  allWeekends: WeekendWithVotes[],
): number {
  const maxTurnout = Math.max(1, ...allWeekends.map((w) => w.votes.length));
  return weekend.votes.length / maxTurnout;
}
