import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import { notify } from "@/lib/notifications";

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

  const existing = await db.orm.Follow.where({ followerId: session.userId, followingId }).first();
  if (existing) {
    await db.orm.Follow.where({ id: existing.id }).delete();
    return NextResponse.json({ following: false });
  }

  await db.orm.Follow.create({ followerId: session.userId, followingId });
  await notify(followingId, session.userId, "follow");
  return NextResponse.json({ following: true });
}
