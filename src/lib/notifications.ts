import { db } from "@/prisma/db";

type FollowNotification = { actorId: string; createdAt: Date; type: string };

export function dedupeFollowNotifications<T extends FollowNotification>(notifications: readonly T[]): T[] {
  const seenActors = new Set<string>();
  return [...notifications]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .filter((notification) => {
      if (notification.type !== "follow") return true;
      if (seenActors.has(notification.actorId)) return false;
      seenActors.add(notification.actorId);
      return true;
    });
}

export function formatNotificationTimestamp(date: Date, now = new Date()): string {
  const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = Math.round((todayDay - dateDay) / 86_400_000);
  const time = date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?(AM|PM)$/i, (period) => ` ${period.trim().toLowerCase()}`);

  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;

  const includeYear = date.getFullYear() !== now.getFullYear();
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
  });
  return `${day}, ${time}`;
}

export async function notify(userId: string, actorId: string, type: string, entityId: string | null = null) {
  if (userId === actorId) return;
  try {
    await db.orm.Notification.create({ userId, actorId, type, entityId, readAt: null });
  } catch (error) {
    console.error("Notification creation failed:", error instanceof Error ? error.message : "unknown error");
  }
}
