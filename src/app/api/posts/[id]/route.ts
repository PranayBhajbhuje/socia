import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to edit a post." }, { status: 401 });

  const { id } = await params;
  const post = await db.orm.Post.where({ id }).first();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (post.authorId !== session.userId) {
    return NextResponse.json({ error: "You can only edit your own posts." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("content" in body) || typeof body.content !== "string") {
    return NextResponse.json({ error: "Caption must be text." }, { status: 400 });
  }

  const content = body.content.trim();
  if (post.type === "text" && !content) {
    return NextResponse.json({ error: "Text posts must include some text." }, { status: 400 });
  }

  const updatedPost = await db.orm.Post.where({ id }).update({ content: content || null });
  if (!updatedPost) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json({ post: { id: updatedPost.id, content: updatedPost.content } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to delete a post." }, { status: 401 });

  const { id } = await params;
  const post = await db.orm.Post.where({ id }).first();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (post.authorId !== session.userId) {
    return NextResponse.json({ error: "You can only delete your own posts." }, { status: 403 });
  }

  await db.orm.Post.where({ id }).delete();
  return NextResponse.json({ deleted: true });
}
