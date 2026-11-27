import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { dedupeFollowNotifications } from "@/lib/notifications";
import { db } from "@/prisma/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });
  const notifications = await db.orm.Notification.where({ userId: session.userId }).orderBy((notification) => notification.createdAt.desc()).all();
  return NextResponse.json({ notifications: dedupeFollowNotifications(notifications) });
}
