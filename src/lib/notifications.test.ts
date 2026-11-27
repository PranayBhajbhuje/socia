import assert from "node:assert/strict";
import test from "node:test";
import { dedupeFollowNotifications, formatNotificationTimestamp } from "./notifications";

test("keeps only the latest started-following notification for each actor", () => {
  const notifications = [
    { id: "older", actorId: "yatharth", type: "follow", createdAt: new Date("2026-11-26T13:15:52.603Z") },
    { id: "other-actor", actorId: "arjun", type: "follow", createdAt: new Date("2026-11-27T12:00:00.000Z") },
    { id: "newer", actorId: "yatharth", type: "follow", createdAt: new Date("2026-11-27T12:58:50.436Z") },
    { id: "request", actorId: "yatharth", type: "follow_request", createdAt: new Date("2026-11-27T13:00:00.000Z") },
  ];

  assert.deepEqual(dedupeFollowNotifications(notifications).map(({ id }) => id), [
    "request",
    "newer",
    "other-actor",
  ]);
});

test("formats notification timestamps using today, yesterday, or a calendar date without seconds", () => {
  const now = new Date(2026, 10, 27, 20, 0, 0);

  assert.equal(formatNotificationTimestamp(new Date(2026, 10, 27, 17, 6, 17), now), "Today, 5:06 pm");
  assert.equal(formatNotificationTimestamp(new Date(2026, 10, 26, 17, 6, 17), now), "Yesterday, 5:06 pm");
  assert.equal(formatNotificationTimestamp(new Date(2026, 10, 25, 17, 6, 17), now), "Nov 25, 5:06 pm");
  assert.equal(formatNotificationTimestamp(new Date(2025, 10, 25, 17, 6, 17), now), "Nov 25, 2025, 5:06 pm");
});
