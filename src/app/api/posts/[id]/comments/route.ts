import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import { notify } from "@/lib/notifications";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(); if (!session) return NextResponse.json({ error: "Sign in to view comments." }, { status: 401 });
  const { id: postId } = await params;
  const post = await db.orm.Post.where({ id: postId }).first(); if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const [comments, users, likes] = await Promise.all([db.orm.PostComment.where({ postId }).orderBy((comment) => comment.createdAt.asc()).all(), db.orm.User.all(), db.orm.PostCommentLike.all()]);
  const userById = new Map(users.map((user) => [user.id, user]));
  const commentsWithAuthors = comments.map((comment) => ({ id: comment.id, postId: comment.postId, authorId: comment.authorId, parentId: comment.parentId, body: comment.body, createdAt: comment.createdAt, author: userById.get(comment.authorId)?.username ?? "user", fullName: userById.get(comment.authorId)?.fullName ?? "User", likeCount: likes.filter((like) => like.commentId === comment.id).length, likedByMe: likes.some((like) => like.commentId === comment.id && like.userId === session.userId) }));
  return NextResponse.json({ comments: commentsWithAuthors.filter((comment) => !comment.parentId).map((comment) => ({ ...comment, replies: commentsWithAuthors.filter((reply) => reply.parentId === comment.id) })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(); if (!session) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  const { id: postId } = await params;
  const post = await db.orm.Post.where({ id: postId }).first(); if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  let body: { body?: unknown; parentId?: unknown }; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid comment." }, { status: 400 }); }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 1000) return NextResponse.json({ error: "Comment must be between 1 and 1000 characters." }, { status: 400 });
  const parentId = typeof body.parentId === "string" ? body.parentId : null;
  if (parentId) { const parent = await db.orm.PostComment.where({ id: parentId, postId }).first(); if (!parent || parent.parentId) return NextResponse.json({ error: "Replies can only be one level deep." }, { status: 400 }); }
  const comment = await db.orm.PostComment.create({ postId, authorId: session.userId, parentId, body: text });
  await notify(parentId ? (await db.orm.PostComment.where({ id: parentId }).first())!.authorId : post.authorId, session.userId, parentId ? "reply" : "comment", postId);
  return NextResponse.json({ comment }, { status: 201 });
}
