import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

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
  for (const message of messages) {
    if (message.senderId !== session.userId && !message.readAt) await db.orm.Message.where({ id: message.id }).update({ readAt: new Date() });
  }
  return NextResponse.json({ messages: messages.map((message) => ({ ...message, reactedByMe: reactedMessageIds.has(message.id) })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  const { id } = await params;
  const conversation = await getConversation(id, session.userId);
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  let body: { body?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!messageBody) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  if (messageBody.length > 2000) return NextResponse.json({ error: "Message must be 2000 characters or fewer." }, { status: 400 });
  const message = await db.orm.Message.create({ conversationId: id, senderId: session.userId, body: messageBody, readAt: null });
  await db.orm.Conversation.where({ id }).update({ updatedAt: new Date() });
  return NextResponse.json({ message }, { status: 201 });
}
