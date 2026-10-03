// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/admin";

// The site is gated by a frontend password plus InstantDB email login. The
// login organizes who is who; strong security is not a goal (QUICKSTART.md),
// so app rules stay open. $users is viewable so the login screen can list
// the emails already used (a ~10-person group, accepted by the owner).
const open = {
  allow: {
    view: "true",
    create: "true",
    update: "true",
    delete: "true",
  },
};

const rules = {
  $users: {
    allow: {
      view: "true",
    },
  },
  weekends: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  votes: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  participants: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  menuSettings: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  menuSessions: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  menuItems: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  drinks: open,
  comments: open,
} satisfies InstantRules;

export default rules;
