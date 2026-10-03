import { describe, expect, test } from "bun:test";
import { cleanNickname, nicknameKey } from "../src/lib/nickname";

describe("cleanNickname", () => {
  test("trims and collapses inner whitespace, keeping case and accents", () => {
    expect(cleanNickname("  João   Pedro ")).toBe("João Pedro");
  });
});

describe("nicknameKey", () => {
  test("same key regardless of case, accents and spacing", () => {
    expect(nicknameKey("Thomaz")).toBe(nicknameKey(" thómaz "));
    expect(nicknameKey("João  Pedro")).toBe("joao pedro");
  });

  test("different names get different keys", () => {
    expect(nicknameKey("Ana")).not.toBe(nicknameKey("Anna"));
  });
});
