import { describe, expect, test } from "bun:test";
import {
  buildMenu,
  formatBRL,
  isInMenu,
  nextOrder,
  parsePayingCount,
  parsePrice,
  perPerson,
  reorder,
  sessionProgress,
  sortByOrder,
  tripDays,
  MAX_TRIP_DAYS,
  type MenuItemData,
  type MenuPerson,
  type MenuSessionData,
} from "../src/lib/menu";

const ana: MenuPerson = { id: "p-ana", name: "Ana", menuVoter: true };
const bia: MenuPerson = { id: "p-bia", name: "Bia", menuVoter: true };
const caio: MenuPerson = { id: "p-caio", name: "Caio", menuVoter: false };
const davi: MenuPerson = { id: "p-davi", name: "Davi" }; // never answered

function item(
  id: string,
  price: number,
  likedBy: MenuPerson[],
  order = 0,
): MenuItemData {
  return { id, name: id, price, order, likedBy };
}

function session(
  id: string,
  date: string | null,
  items: MenuItemData[],
  order = 0,
): MenuSessionData {
  return { id, name: id, order, date, items };
}

describe("tripDays", () => {
  test("lists every day from arrival to departure, inclusive", () => {
    expect(tripDays("2026-12-11", "2026-12-13")).toEqual([
      "2026-12-11",
      "2026-12-12",
      "2026-12-13",
    ]);
  });

  test("crosses month boundaries", () => {
    expect(tripDays("2026-10-31", "2026-11-01")).toEqual([
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  test("single-day trip", () => {
    expect(tripDays("2026-12-11", "2026-12-11")).toEqual(["2026-12-11"]);
  });

  test("is empty when a date is missing", () => {
    expect(tripDays(undefined, "2026-12-13")).toEqual([]);
    expect(tripDays("2026-12-11", null)).toEqual([]);
    expect(tripDays("", "")).toEqual([]);
  });

  test("is empty when departure is before arrival", () => {
    expect(tripDays("2026-12-13", "2026-12-11")).toEqual([]);
  });

  test("is empty when the range is longer than MAX_TRIP_DAYS", () => {
    expect(tripDays("2026-01-01", "2027-01-01")).toEqual([]);
    expect(tripDays("2026-01-01", "2026-03-03")).toHaveLength(MAX_TRIP_DAYS);
  });
});

describe("isInMenu", () => {
  test("1 of 2 voters is enough (50%)", () => {
    expect(isInMenu(1, 2)).toBe(true);
  });
  test("1 of 3 voters is not enough", () => {
    expect(isInMenu(1, 3)).toBe(false);
  });
  test("2 of 4 voters is enough", () => {
    expect(isInMenu(2, 4)).toBe(true);
  });
  test("nothing is in the menu without voters", () => {
    expect(isInMenu(0, 0)).toBe(false);
  });
  test("0 of 1 is not enough", () => {
    expect(isInMenu(0, 1)).toBe(false);
  });
});

describe("sortByOrder / nextOrder", () => {
  test("sorts by order, breaking ties by id", () => {
    const list = [
      { id: "b", order: 1 },
      { id: "c", order: 0 },
      { id: "a", order: 1 },
    ];
    expect(sortByOrder(list).map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  test("does not mutate the input", () => {
    const list = [
      { id: "b", order: 1 },
      { id: "a", order: 0 },
    ];
    sortByOrder(list);
    expect(list.map((x) => x.id)).toEqual(["b", "a"]);
  });

  test("nextOrder is 0 for an empty list, max+1 otherwise", () => {
    expect(nextOrder([])).toBe(0);
    expect(nextOrder([{ order: 3 }, { order: 7 }, { order: 1 }])).toBe(8);
  });
});

describe("reorder", () => {
  const sorted = [
    { id: "a", order: 0 },
    { id: "b", order: 1 },
    { id: "c", order: 2 },
  ];

  test("moving an item up swaps it with the previous one", () => {
    expect(reorder(sorted, 1, -1)).toEqual([
      { id: "b", order: 0 },
      { id: "a", order: 1 },
    ]);
  });

  test("moving an item down swaps it with the next one", () => {
    expect(reorder(sorted, 1, 1)).toEqual(
      expect.arrayContaining([
        { id: "b", order: 2 },
        { id: "c", order: 1 },
      ]),
    );
    expect(reorder(sorted, 1, 1)).toHaveLength(2);
  });

  test("moving past either end is a no-op", () => {
    expect(reorder(sorted, 0, -1)).toEqual([]);
    expect(reorder(sorted, 2, 1)).toEqual([]);
  });

  test("tied orders get renumbered so the move actually happens", () => {
    const tied = sortByOrder([
      { id: "a", order: 5 },
      { id: "b", order: 5 },
      { id: "c", order: 5 },
    ]);
    const updates = reorder(tied, 2, -1);
    const orders = new Map(tied.map((x) => [x.id, x.order]));
    for (const u of updates) orders.set(u.id, u.order);
    const result = sortByOrder(
      [...orders].map(([id, order]) => ({ id, order })),
    ).map((x) => x.id);
    expect(result).toEqual(["a", "c", "b"]);
  });
});

describe("buildMenu", () => {
  const days = { arrival: "2026-12-11", departure: "2026-12-12" };
  const participants = [ana, bia, caio, davi];

  test("voters are only participants who opted in", () => {
    const state = buildMenu({ sessions: [], participants, ...days });
    expect(state.voters.map((p) => p.id)).toEqual(["p-ana", "p-bia"]);
  });

  test("puts the general card first, then one card per trip day", () => {
    const state = buildMenu({
      sessions: [
        session("jantar", "2026-12-12", []),
        session("cafe", null, []),
        session("almoco", "2026-12-11", []),
      ],
      participants,
      ...days,
    });
    expect(state.cards.map((c) => c.date)).toEqual([
      null,
      "2026-12-11",
      "2026-12-12",
    ]);
    expect(state.cards[0].sessions.map((s) => s.session.id)).toEqual(["cafe"]);
    expect(state.cards[2].sessions.map((s) => s.session.id)).toEqual([
      "jantar",
    ]);
  });

  test("sessions and items follow their order", () => {
    const state = buildMenu({
      sessions: [
        session(
          "s2",
          "2026-12-11",
          [item("x", 1, [], 2), item("y", 1, [], 1)],
          1,
        ),
        session("s1", "2026-12-11", [], 0),
      ],
      participants,
      ...days,
    });
    const card = state.cards[1];
    expect(card.sessions.map((s) => s.session.id)).toEqual(["s1", "s2"]);
    expect(card.sessions[1].items.map((i) => i.item.id)).toEqual(["y", "x"]);
  });

  test("ignores likes from people who are not voters", () => {
    const state = buildMenu({
      sessions: [
        session("cafe", null, [item("pao", 30, [ana, caio, davi])]),
      ],
      participants,
      ...days,
    });
    const scored = state.cards[0].sessions[0].items[0];
    expect(scored.support).toBe(1);
    expect(scored.likers.map((p) => p.id)).toEqual(["p-ana"]);
    expect(scored.inMenu).toBe(true); // 1/2
  });

  test("ignores likes from participants that no longer exist", () => {
    const ghost: MenuPerson = { id: "p-ghost", name: "X", menuVoter: true };
    const state = buildMenu({
      sessions: [session("cafe", null, [item("pao", 30, [ghost])])],
      participants,
      ...days,
    });
    expect(state.cards[0].sessions[0].items[0].support).toBe(0);
  });

  test("total sums only items that made it into the menu", () => {
    const state = buildMenu({
      sessions: [
        session("cafe", null, [
          item("pao", 30, [ana]), // 1/2 -> in
          item("suco", 20, []), // 0/2 -> out
        ]),
        session("churras", "2026-12-11", [item("picanha", 100, [ana, bia])]),
      ],
      participants,
      ...days,
    });
    expect(state.total).toBe(130);
  });

  test("sessions dated outside the trip are dropped and not counted", () => {
    const state = buildMenu({
      sessions: [session("velha", "2026-11-01", [item("x", 999, [ana])])],
      participants,
      ...days,
    });
    expect(state.total).toBe(0);
    expect(state.cards.flatMap((c) => c.sessions)).toHaveLength(0);
  });

  test("a new voter raises the denominator and can drop an item", () => {
    const sessions = [session("s", null, [item("picanha", 100, [ana])])];
    const two = buildMenu({ sessions, participants, ...days });
    expect(two.total).toBe(100); // 1/2

    const eve: MenuPerson = { id: "p-eve", name: "Eve", menuVoter: true };
    const three = buildMenu({
      sessions,
      participants: [...participants, eve],
      ...days,
    });
    expect(three.cards[0].sessions[0].items[0].inMenu).toBe(false); // 1/3
    expect(three.total).toBe(0);
  });
});

describe("required items", () => {
  const days = { arrival: "2026-12-11", departure: "2026-12-12" };
  const carvao = (likedBy: MenuPerson[] = []): MenuItemData => ({
    ...item("carvao", 50, likedBy),
    required: true,
  });

  test("are in the menu even without any voters", () => {
    const state = buildMenu({
      sessions: [session("churras", null, [carvao()])],
      participants: [caio, davi],
      ...days,
    });
    expect(state.cards[0].sessions[0].items[0].inMenu).toBe(true);
    expect(state.total).toBe(50);
  });

  test("are in the menu without votes when there are voters", () => {
    const state = buildMenu({
      sessions: [session("churras", null, [carvao(), item("picanha", 100, [])])],
      participants: [ana, bia],
      ...days,
    });
    expect(state.total).toBe(50);
  });

  test("ignore stored likes (they are not up for voting)", () => {
    const state = buildMenu({
      sessions: [session("churras", null, [carvao([ana])])],
      participants: [ana, bia],
      ...days,
    });
    const scored = state.cards[0].sessions[0].items[0];
    expect(scored.support).toBe(0);
    expect(scored.likers).toEqual([]);
    expect(state.total).toBe(50);
  });

  test("required: false behaves like a normal votable item", () => {
    const state = buildMenu({
      sessions: [
        session("churras", null, [{ ...item("carvao", 50, [ana]), required: false }]),
      ],
      participants: [ana, bia],
      ...days,
    });
    expect(state.cards[0].sessions[0].items[0].support).toBe(1);
    expect(state.total).toBe(50); // 1/2
  });
});

describe("sessionProgress", () => {
  const days = { arrival: "2026-12-11", departure: "2026-12-12" };
  const view = (items: MenuItemData[]) =>
    buildMenu({ sessions: [session("s", null, items)], participants: [ana, bia], ...days })
      .cards[0].sessions[0];

  test("counts votable items and the ones this person voted for", () => {
    const v = view([item("a", 1, [ana]), item("b", 1, [bia]), item("c", 1, [ana, bia])]);
    expect(sessionProgress(v, "p-ana")).toEqual({ voted: 2, votable: 3 });
  });

  test("required items are not votable and don't count", () => {
    const v = view([
      { ...item("carvao", 1, [ana]), required: true },
      item("picanha", 1, []),
    ]);
    expect(sessionProgress(v, "p-ana")).toEqual({ voted: 0, votable: 1 });
  });

  test("empty session", () => {
    expect(sessionProgress(view([]), "p-ana")).toEqual({ voted: 0, votable: 0 });
  });
});

describe("perPerson / formatBRL", () => {
  test("divides the total by the paying count", () => {
    expect(perPerson(100, 10)).toBe(10);
  });

  test("is null without a positive paying count", () => {
    expect(perPerson(100, 0)).toBeNull();
    expect(perPerson(100, undefined)).toBeNull();
    expect(perPerson(100, null)).toBeNull();
    expect(perPerson(100, -2)).toBeNull();
  });

  test("formats as Brazilian reais", () => {
    expect(formatBRL(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});

describe("parsePrice", () => {
  test("accepts dot or comma decimals", () => {
    expect(parsePrice("12.5")).toBe(12.5);
    expect(parsePrice("12,50")).toBe(12.5);
    expect(parsePrice(" 100 ")).toBe(100);
  });

  test("accepts Brazilian thousands separators", () => {
    expect(parsePrice("1.234,56")).toBe(1234.56);
  });

  test("reads dot-grouped thousands without a comma as thousands", () => {
    expect(parsePrice("1.500")).toBe(1500);
    expect(parsePrice("12.000")).toBe(12000);
    expect(parsePrice("1.234.567")).toBe(1234567);
    // Not a thousands group: still a decimal point.
    expect(parsePrice("1.50")).toBe(1.5);
    expect(parsePrice("1.5000")).toBe(1.5);
  });

  test("strips a leading R$", () => {
    expect(parsePrice("R$ 80,00")).toBe(80);
  });

  test("zero is allowed", () => {
    expect(parsePrice("0")).toBe(0);
  });

  test("rejects empty, non-numeric and negative values", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("   ")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
    expect(parsePrice("-5")).toBeNull();
    expect(parsePrice("12,3,4")).toBeNull();
  });

  test("rounds to cents", () => {
    expect(parsePrice("10,006")).toBe(10.01);
  });
});

describe("parsePayingCount", () => {
  test("accepts non-negative integers", () => {
    expect(parsePayingCount("10")).toBe(10);
    expect(parsePayingCount("0")).toBe(0);
  });

  test("rejects empty, fractional and negative values", () => {
    expect(parsePayingCount("")).toBeNull();
    expect(parsePayingCount("2.5")).toBeNull();
    expect(parsePayingCount("-1")).toBeNull();
    expect(parsePayingCount("x")).toBeNull();
  });
});
