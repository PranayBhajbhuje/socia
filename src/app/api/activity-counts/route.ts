import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { dedupeFollowNotifications } from "@/lib/notifications";
import { db } from "@/prisma/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to view activity." }, { status: 401 });

  const [requests, notifications, conversations] = await Promise.all([
    db.orm.Follow.where({ followingId: session.userId, status: "pending" }).all(),
    db.orm.Notification.where({ userId: session.userId }).all(),
    db.orm.Conversation.all(),
  ]);
  const unreadNotifications = dedupeFollowNotifications(notifications).filter((notification) => !notification.readAt && notification.type !== "follow_request").length;
  const myConversations = conversations.filter((conversation) =>
    conversation.userOneId === session.userId || conversation.userTwoId === session.userId
  );
  const messageLists = await Promise.all(myConversations.map((conversation) =>
    db.orm.Message.where({ conversationId: conversation.id }).all()
  ));
  const unreadMessages = messageLists.flat().filter((message) =>
    message.senderId !== session.userId && !message.readAt
  ).length;

  return NextResponse.json({
    notifications: unreadNotifications + requests.length,
    messages: unreadMessages,
  });
}
