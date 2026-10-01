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
      // Cards are always listed in chronological order by this field.
      fridayDate: i.string().indexed(),
    }),
    votes: i.entity({
      // "friday" (whole weekend) or "saturday" (arrives Saturday only)
      arrivalType: i.string(),
    }),
    participants: i.entity({
      // The person's chosen display name doubles as their cross-device
      // identity: unique so the same name can be picked up on another
      // device to control the same votes (see participants.ts).
      name: i.string().unique().indexed(),
      // Menu voting opt-in: undefined = never answered (show the opt-in
      // screen), true = counts as a voter, false = just watching. Leaving
      // keeps their likes stored but ignored (see menu.ts).
      menuVoter: i.boolean().optional().indexed(),
    }),
    // Single row (fixed id MENU_SETTINGS_ID in menuDb.ts) with the trip-wide
    // menu config. Days are derived from arrival..departure, not stored.
    menuSettings: i.entity({
      payingCount: i.number().optional(),
      arrivalDate: i.string().optional(),
      departureDate: i.string().optional(),
    }),
    menuSessions: i.entity({
      // ISO date of the trip day; absent = the "Geral" card (purchases that
      // cover several days, e.g. breakfast).
      date: i.string().optional().indexed(),
      name: i.string(),
      order: i.number().indexed(),
    }),
    menuItems: i.entity({
      name: i.string(),
      // Total cost of the item, not per person.
      price: i.number(),
      // Descriptive only, never used in calculations.
      quantity: i.string().optional(),
      description: i.string().optional(),
      order: i.number().indexed(),
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
    participantVotes: {
      forward: {
        on: "votes",
        has: "one",
        label: "participant",
        onDelete: "cascade",
      },
      reverse: {
        on: "participants",
        has: "many",
        label: "votes",
      },
    },
    sessionItems: {
      forward: {
        on: "menuItems",
        has: "one",
        label: "session",
        onDelete: "cascade",
      },
      reverse: {
        on: "menuSessions",
        has: "many",
        label: "items",
      },
    },
    // A vote is just a link: a participant "likes" an item. Links are
    // unique, so nobody can vote twice for the same item.
    menuItemLikes: {
      forward: {
        on: "menuItems",
        has: "many",
        label: "likedBy",
      },
      reverse: {
        on: "participants",
        has: "many",
        label: "likedMenuItems",
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
