import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

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
