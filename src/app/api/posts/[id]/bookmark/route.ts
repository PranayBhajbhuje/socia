import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to save posts." }, { status: 401 });
  const { id: postId } = await params;
  const post = await db.orm.Post.where({ id: postId }).first();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const existing = await db.orm.PostBookmark.where({ userId: session.userId, postId }).first();
  if (existing) await db.orm.PostBookmark.where({ id: existing.id }).delete();
  else await db.orm.PostBookmark.create({ userId: session.userId, postId });
  return NextResponse.json({ bookmarked: !existing });
}
