import { describe, expect, test } from "bun:test";
import {
  COMMENT_MAX,
  canDeleteComment,
  sortComments,
  validateComment,
  type CommentData,
} from "../src/lib/comments";

const c = (id: string, createdAt: number, authorId?: string): CommentData => ({
  id,
  text: "x",
  createdAt,
  author: authorId ? { id: authorId, name: authorId } : null,
});

describe("validateComment", () => {
  test("trims surrounding whitespace", () => {
    expect(validateComment("  oi  ")).toBe("oi");
  });

  test("rejects empty or whitespace-only text", () => {
    expect(validateComment("")).toBeNull();
    expect(validateComment("   \n ")).toBeNull();
  });

  test("accepts exactly COMMENT_MAX characters and rejects one more", () => {
    expect(validateComment("a".repeat(COMMENT_MAX))).toBe("a".repeat(COMMENT_MAX));
    expect(validateComment("a".repeat(COMMENT_MAX + 1))).toBeNull();
  });
});

describe("sortComments", () => {
  test("orders oldest first, ties broken by id, without mutating input", () => {
    const input = [c("b", 2), c("z", 1), c("a", 2)];
    expect(sortComments(input).map((x) => x.id)).toEqual(["z", "a", "b"]);
    expect(input.map((x) => x.id)).toEqual(["b", "z", "a"]);
  });
});

describe("canDeleteComment", () => {
  test("author can delete their own comment", () => {
    expect(canDeleteComment(c("1", 1, "me"), "me", false)).toBe(true);
  });

  test("others cannot delete it", () => {
    expect(canDeleteComment(c("1", 1, "other"), "me", false)).toBe(false);
  });

  test("admin can delete any comment, even without author", () => {
    expect(canDeleteComment(c("1", 1, "other"), "me", true)).toBe(true);
    expect(canDeleteComment(c("1", 1), "me", true)).toBe(true);
  });

  test("authorless comment is not deletable by non-admin", () => {
    expect(canDeleteComment(c("1", 1), "me", false)).toBe(false);
  });
});
