import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(); if (!session) return NextResponse.json({ error: "Sign in to like comments." }, { status: 401 });
  const { id } = await params;
  const comment = await db.orm.PostComment.where({ id }).first(); if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  const existing = await db.orm.PostCommentLike.where({ userId: session.userId, commentId: id }).first();
  if (existing) await db.orm.PostCommentLike.where({ id: existing.id }).delete(); else await db.orm.PostCommentLike.create({ userId: session.userId, commentId: id });
  const likes = await db.orm.PostCommentLike.where({ commentId: id }).all();
  return NextResponse.json({ liked: !existing, likeCount: likes.length });
}
