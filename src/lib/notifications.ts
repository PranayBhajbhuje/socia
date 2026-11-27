import { db } from "@/prisma/db";

export async function notify(userId: string, actorId: string, type: string, entityId: string | null = null) {
  if (userId === actorId) return;
  try {
    await db.orm.Notification.create({ userId, actorId, type, entityId, readAt: null });
  } catch (error) {
    console.error("Notification creation failed:", error instanceof Error ? error.message : "unknown error");
  }
}
