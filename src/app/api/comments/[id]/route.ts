import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Sign in to delete comments." }, { status: 401 });

    const { id } = await params;
    const comment = await db.orm.PostComment.where({ id }).first();
    if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    if (comment.authorId !== session.userId) {
      return NextResponse.json({ error: "You can only delete your own comments." }, { status: 403 });
    }

    const replies = await db.orm.PostComment.where({ parentId: id }).all();
    await db.orm.PostComment.where({ id }).delete();
    return NextResponse.json({ deleted: true, deletedCount: replies.length + 1 });
  } catch (error) {
    console.error("DELETE /api/comments/[id] error:", error);
    return NextResponse.json({ error: "Unable to delete comment." }, { status: 500 });
  }
}
