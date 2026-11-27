import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to follow people." }, { status: 401 });

  const { id: followingId } = await params;
  if (followingId === session.userId) {
    return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  }

  const target = await db.orm.User.where({ id: followingId }).first();
  if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const status = await db.transaction(async (tx) => {
    const existing = await tx.orm.Follow.where({ followerId: session.userId, followingId }).first();
    if (existing) {
      return existing.status === "pending" ? "pending" : existing.status === "accepted" ? "accepted" : null;
    }

    const request = await tx.orm.Follow.create({ followerId: session.userId, followingId, status: "pending" });
    await tx.orm.Notification.create({
      userId: followingId,
      actorId: session.userId,
      type: "follow_request",
      entityId: request.id,
      readAt: null,
    });
    return "pending";
  });

  return NextResponse.json({ status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to manage following." }, { status: 401 });

  const { id: followingId } = await params;
  if (followingId === session.userId) {
    return NextResponse.json({ error: "You cannot unfollow yourself." }, { status: 400 });
  }

  const target = await db.orm.User.where({ id: followingId }).first();
  if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  await db.transaction(async (tx) => {
    const existing = await tx.orm.Follow.where({ followerId: session.userId, followingId }).first();
    if (!existing) return;

    await tx.orm.Follow.where({ id: existing.id }).delete();
    if (existing.status === "pending") {
      await tx.orm.Notification.where({
        userId: followingId,
        type: "follow_request",
        entityId: existing.id,
      }).delete();
    }
  });

  return NextResponse.json({ status: null });
}
