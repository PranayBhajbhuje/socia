"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";

type IncomingMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  sender: { fullName: string; username: string; avatarUrl: string | null };
};

type ConversationsResponse = {
  conversations?: Array<{
    id: string;
    otherUser: IncomingMessage["sender"];
    unreadMessages?: Omit<IncomingMessage, "conversationId" | "sender">[];
  }>;
  error?: string;
};

export default function MessageToast({ userId }: { userId: string }) {
  const [notice, setNotice] = useState<IncomingMessage | null>(null);

  useEffect(() => {
    let active = true;
    let initialized = false;
    const knownMessageIds = new Set<string>();

    async function refresh() {
      try {
        const response = await fetch("/api/conversations", { cache: "no-store" });
        const data = await response.json() as ConversationsResponse;
        if (!response.ok || !data.conversations) throw new Error(data.error ?? "Could not check for new messages.");

        const unread = data.conversations.flatMap((conversation) =>
          (conversation.unreadMessages ?? [])
            .filter((message) => message.senderId !== userId)
            .map((message) => ({
              ...message,
              conversationId: conversation.id,
              sender: conversation.otherUser,
            }))
        );
        if (!active) return;
        if (!initialized) {
          unread.forEach((message) => knownMessageIds.add(message.id));
          initialized = true;
          return;
        }

        const freshMessages = unread.filter((message) => !knownMessageIds.has(message.id));
        unread.forEach((message) => knownMessageIds.add(message.id));
        if (freshMessages.length) {
          freshMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotice(freshMessages[0]);
        }
      } catch (error) {
        console.error("Could not check for incoming messages:", error);
      }
    }

    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 10_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 8_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice) return null;

  return <aside role="status" aria-live="polite" className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-neutral-900">
    <div className="flex items-start gap-3">
      <Link href={`/messages/${encodeURIComponent(notice.conversationId)}`} onClick={() => setNotice(null)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <UserAvatar src={notice.sender.avatarUrl} name={notice.sender.fullName} sizeClass="h-10 w-10" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{notice.sender.fullName} sent you a message</span>
          <span className="block truncate text-sm text-zinc-600 dark:text-zinc-300">{notice.body}</span>
        </span>
      </Link>
      <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message notification" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800">×</button>
    </div>
  </aside>;
}
