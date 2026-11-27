import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(); if (!session) return NextResponse.json({ error: "Sign in to view videos." }, { status: 401 });
  const { id: postId } = await params;
  const post = await db.orm.Post.where({ id: postId }).first(); if (!post || post.type !== "video") return NextResponse.json({ error: "Video not found." }, { status: 404 });
  const existing = await db.orm.VideoView.where({ postId, userId: session.userId }).first();
  if (!existing) await db.orm.VideoView.create({ postId, userId: session.userId });
  const views = await db.orm.VideoView.where({ postId }).all();
  return NextResponse.json({ viewCount: views.length });
}
