import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to manage follow requests." }, { status: 401 });

  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid follow request action." }, { status: 400 });
  }
  if (body.action !== "accept" && body.action !== "decline") {
    return NextResponse.json({ error: "Choose whether to accept or decline the request." }, { status: 400 });
  }

  const { id } = await params;
  const result = await db.transaction(async (tx) => {
    const follow = await tx.orm.Follow.where({ id }).first();
    if (!follow) return { error: "Follow request not found.", statusCode: 404 };
    if (follow.followingId !== session.userId) {
      return { error: "You can only manage requests sent to you.", statusCode: 403 };
    }
    if (follow.status !== "pending") {
      return { error: "This follow request is no longer pending.", statusCode: 409 };
    }

    if (body.action === "accept") {
      await tx.orm.Follow.where({ id }).update({ status: "accepted" });
      const requestNotification = await tx.orm.Notification.where({
        userId: session.userId,
        type: "follow_request",
        entityId: id,
      }).first();
      if (requestNotification) {
        await tx.orm.Notification.where({ id: requestNotification.id }).update({ type: "follow", entityId: null });
      }

      const followNotifications = await tx.orm.Notification.where({
        userId: session.userId,
        actorId: follow.followerId,
        type: "follow",
      }).all();
      const keepNotification = requestNotification ?? followNotifications.reduce<typeof followNotifications[number] | null>(
        (latest, notification) => !latest || notification.createdAt > latest.createdAt ? notification : latest,
        null
      );
      if (keepNotification) {
        if (!requestNotification) {
          await tx.orm.Notification.where({ id: keepNotification.id }).update({ createdAt: new Date(), readAt: null });
        }
        for (const notification of followNotifications) {
          if (notification.id !== keepNotification.id) {
            await tx.orm.Notification.where({ id: notification.id }).delete();
          }
        }
      } else {
        await tx.orm.Notification.create({
          userId: session.userId,
          actorId: follow.followerId,
          type: "follow",
          entityId: null,
          readAt: null,
        });
      }

      await tx.orm.Notification.create({
        userId: follow.followerId,
        actorId: session.userId,
        type: "follow_accepted",
        entityId: null,
        readAt: null,
      });
      return { status: "accepted" };
    }

    await tx.orm.Follow.where({ id }).delete();
    await tx.orm.Notification.where({ userId: session.userId, type: "follow_request", entityId: id }).delete();
    return { status: "declined" };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.statusCode });
  return NextResponse.json(result);
}
