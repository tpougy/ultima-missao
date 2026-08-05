// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/admin";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $streams: i.entity({
      abortReason: i.string().optional(),
      clientId: i.string().unique().indexed(),
      done: i.boolean().optional(),
      size: i.number().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    weekends: i.entity({
      // ISO date (YYYY-MM-DD) for the Friday; Saturday/Sunday are derived in the UI.
      fridayDate: i.string().indexed(),
      order: i.number().indexed(),
    }),
    votes: i.entity({
      // Generated client-side per browser/device, stored in localStorage. Not a real auth id.
      participantId: i.string().indexed(),
      participantName: i.string(),
      // "friday" (whole weekend) or "saturday" (arrives Saturday only)
      arrivalType: i.string(),
    }),
  },
  links: {
    $streams$files: {
      forward: {
        on: "$streams",
        has: "many",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "$stream",
        onDelete: "cascade",
      },
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    weekendVotes: {
      forward: {
        on: "votes",
        has: "one",
        label: "weekend",
        onDelete: "cascade",
      },
      reverse: {
        on: "weekends",
        has: "many",
        label: "votes",
      },
    },
  },
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
