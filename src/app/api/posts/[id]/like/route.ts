import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import { notify } from "@/lib/notifications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Sign in to like posts." }, { status: 401 });

    const { id: postId } = await params;
    const post = await db.orm.Post.where({ id: postId }).first();
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    const existing = await db.orm.PostLike.where({ userId: session.userId, postId }).first();
    if (existing) {
      await db.orm.PostLike.where({ id: existing.id }).delete();
    } else {
      await db.orm.PostLike.create({ userId: session.userId, postId });
      await notify(post.authorId, session.userId, "like", postId);
    }

    const likes = await db.orm.PostLike.where({ postId }).all();
    return NextResponse.json({ liked: !existing, likeCount: likes.length });
  } catch (error) {
    console.error("POST /api/posts/[id]/like error:", error);
    return NextResponse.json({ error: "Unable to update like." }, { status: 500 });
  }
}
