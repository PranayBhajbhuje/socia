import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import { encodeSharedPostMessage, getMessagePreview, getSharedPostId } from "@/lib/shared-post-message";

async function getConversation(id: string, userId: string) {
  const conversation = await db.orm.Conversation.where({ id }).first();
  if (!conversation || (conversation.userOneId !== userId && conversation.userTwoId !== userId)) return null;
  return conversation;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  const { id } = await params;
  const conversation = await getConversation(id, session.userId);
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const messages = await db.orm.Message.where({ conversationId: id }).orderBy((message) => message.createdAt.asc()).all();
  const reactions = await db.orm.MessageReaction.where({ userId: session.userId }).all();
  const reactedMessageIds = new Set(reactions.map((reaction) => reaction.messageId));
  const sharedPostIds = [...new Set(messages.map((message) => getSharedPostId(message.body)).filter((id): id is string => id !== null))];
  const sharedPostRows = await Promise.all(sharedPostIds.map((postId) => db.orm.Post.where({ id: postId }).include("author").first()));
  const sharedPosts = new Map(
    sharedPostRows
      .filter((post) => post !== null)
      .map((post) => [post.id, {
        id: post.id,
        type: post.type,
        content: post.content,
        mediaUrl: post.mediaUrl,
        musicTitle: post.musicTitle,
        author: { fullName: post.author.fullName, username: post.author.username },
      }]),
  );
  for (const message of messages) {
    if (message.senderId !== session.userId && !message.readAt) await db.orm.Message.where({ id: message.id }).update({ readAt: new Date() });
  }
  return NextResponse.json({ messages: messages.map((message) => {
    const sharedPostId = getSharedPostId(message.body);
    return {
      ...message,
      body: getMessagePreview(message.body),
      sharedPost: sharedPostId ? sharedPosts.get(sharedPostId) ?? null : null,
      reactedByMe: reactedMessageIds.has(message.id),
    };
  }) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  const { id } = await params;
  const conversation = await getConversation(id, session.userId);
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  let body: { body?: unknown; sharePostId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  let messageBody: string;
  if (typeof body.sharePostId === "string" && body.sharePostId.trim()) {
    const post = await db.orm.Post.where({ id: body.sharePostId.trim() }).first();
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    messageBody = encodeSharedPostMessage(post.id);
  } else {
    messageBody = typeof body.body === "string" ? body.body.trim() : "";
    if (getSharedPostId(messageBody)) {
      return NextResponse.json({ error: "Use the share action to share a post." }, { status: 400 });
    }
  }
  if (!messageBody) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  if (messageBody.length > 2000) return NextResponse.json({ error: "Message must be 2000 characters or fewer." }, { status: 400 });
  const message = await db.orm.Message.create({ conversationId: id, senderId: session.userId, body: messageBody, readAt: null });
  await db.orm.Conversation.where({ id }).update({ updatedAt: new Date() });
  return NextResponse.json({ message }, { status: 201 });
}
