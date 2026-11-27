import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to react to messages." }, { status: 401 });
  const { id, messageId } = await params;
  const conversation = await db.orm.Conversation.where({ id }).first();
  if (!conversation || (conversation.userOneId !== session.userId && conversation.userTwoId !== session.userId)) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  const message = await db.orm.Message.where({ id: messageId, conversationId: id }).first();
  if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  const existing = await db.orm.MessageReaction.where({ userId: session.userId, messageId }).first();
  if (existing) {
    await db.orm.MessageReaction.where({ id: existing.id }).delete();
    return NextResponse.json({ reacted: false });
  }
  await db.orm.MessageReaction.create({ userId: session.userId, messageId, reaction: "heart" });
  return NextResponse.json({ reacted: true });
}
