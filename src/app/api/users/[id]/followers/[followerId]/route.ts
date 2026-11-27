import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; followerId: string }> }) {
  const session = await getSessionUser(); if (!session) return NextResponse.json({ error: "Sign in to manage followers." }, { status: 401 });
  const { id: profileId, followerId } = await params;
  if (session.userId !== profileId) return NextResponse.json({ error: "You can only remove followers from your own account." }, { status: 403 });
  const relationship = await db.orm.Follow.where({ followerId, followingId: profileId, status: "accepted" }).first();
  if (!relationship) return NextResponse.json({ error: "Follower not found." }, { status: 404 });
  await db.orm.Follow.where({ id: relationship.id }).delete();
  return NextResponse.json({ removed: true });
}
