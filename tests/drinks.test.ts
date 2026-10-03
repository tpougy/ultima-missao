import { describe, expect, test } from "bun:test";
import {
  findDuplicate,
  normalizeDrinkName,
  sortDrinks,
  type DrinkData,
} from "../src/lib/drinks";

const d = (id: string, name: string, createdAt = 0, members = 0): DrinkData => ({
  id,
  name,
  createdAt,
  members: Array.from({ length: members }, (_, i) => ({ id: `p${i}`, name: `P${i}` })),
});

describe("normalizeDrinkName", () => {
  test("drops accents, case and extra spaces", () => {
    expect(normalizeDrinkName("  Vódka   Absolut ")).toBe("vodka absolut");
  });
});

describe("findDuplicate", () => {
  const drinks = [d("1", "Vodka"), d("2", "Cerveja")];

  test("matches ignoring accents, case and spacing", () => {
    expect(findDuplicate(drinks, " vódka ")?.id).toBe("1");
  });

  test("ignores the drink being edited", () => {
    expect(findDuplicate(drinks, "Vodka", "1")).toBeNull();
  });

  test("returns null when no drink matches", () => {
    expect(findDuplicate(drinks, "Gin")).toBeNull();
  });
});

describe("sortDrinks", () => {
  test("most members first, then oldest, without mutating input", () => {
    const input = [d("a", "A", 3, 1), d("b", "B", 1, 2), d("c", "C", 2, 1)];
    expect(sortDrinks(input).map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(input.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});
