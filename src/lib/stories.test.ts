import assert from "node:assert/strict";
import test from "node:test";
import { groupStoriesByUser } from "./stories";

const user = (username: string) => ({ fullName: username, username, avatarUrl: null });
const story = (id: string, userId: string, username: string, expiresAt: string) => ({
  id,
  userId,
  username,
  expiresAt,
  user: user(username),
});

test("groups one user's stories in chronological order", () => {
  const groups = groupStoriesByUser([
    story("later", "me", "me", "2026-11-27T12:00:00.000Z"),
    story("friend", "friend", "friend", "2026-11-27T10:00:00.000Z"),
    story("earlier", "me", "me", "2026-11-27T11:00:00.000Z"),
  ], "me");

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].stories.map((item) => item.id), ["earlier", "later"]);
  assert.equal(groups[1].stories[0].id, "friend");
});

test("puts the current user's group first and other groups by latest story", () => {
  const groups = groupStoriesByUser([
    story("friend-old", "friend", "friend", "2026-11-27T08:00:00.000Z"),
    story("other-new", "other", "other", "2026-11-27T11:00:00.000Z"),
    story("mine", "me", "me", "2026-11-27T09:00:00.000Z"),
    story("friend-new", "friend", "friend", "2026-11-27T10:00:00.000Z"),
  ], "me");

  assert.deepEqual(groups.map((group) => group.userId), ["me", "other", "friend"]);
});
