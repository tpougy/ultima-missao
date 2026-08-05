// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/admin";

// There's no real InstantDB auth in this app (see CLAUDE.md for why): access
// is gated by a plain frontend password instead. Rules stay open so any
// client holding the appId can read/write, matching the "no strong security
// needed" requirement from QUICKSTART.md.
const rules = {
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
} satisfies InstantRules;

export default rules;
