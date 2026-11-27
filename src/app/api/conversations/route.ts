import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  const [all, users] = await Promise.all([db.orm.Conversation.all(), db.orm.User.all()]);
  const userById = new Map(users.map((user) => [user.id, user]));
  const mine = all.filter((conversation) => conversation.userOneId === session.userId || conversation.userTwoId === session.userId);
  const entries = await Promise.all(mine.map(async (conversation) => {
    const otherId = conversation.userOneId === session.userId ? conversation.userTwoId : conversation.userOneId;
    const other = userById.get(otherId);
    if (!other) return null;
    const messages = await db.orm.Message.where({ conversationId: conversation.id }).orderBy((message) => message.createdAt.desc()).all();
    const latest = messages[0] ?? null;
    const unreadCount = messages.filter((message) => message.senderId !== session.userId && !message.readAt).length;
    return { id: conversation.id, otherUser: { id: other.id, fullName: other.fullName, username: other.username, avatarUrl: other.avatarUrl }, lastMessage: latest ? { body: latest.body, createdAt: latest.createdAt, senderId: latest.senderId } : null, unreadCount, updatedAt: conversation.updatedAt };
  }));
  return NextResponse.json({ conversations: entries.filter((entry) => entry !== null).sort((a, b) => new Date(b!.updatedAt).getTime() - new Date(a!.updatedAt).getTime()) });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to start a conversation." }, { status: 401 });
  let body: { userId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.userId !== "string" || !body.userId || body.userId === session.userId) return NextResponse.json({ error: "Choose another account." }, { status: 400 });
  const other = await db.orm.User.where({ id: body.userId }).first();
  if (!other) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const [userOneId, userTwoId] = orderedPair(session.userId, other.id);
  let conversation = await db.orm.Conversation.where({ userOneId, userTwoId }).first();
  if (!conversation) conversation = await db.orm.Conversation.create({ userOneId, userTwoId });
  return NextResponse.json({ conversationId: conversation.id }, { status: 200 });
}
