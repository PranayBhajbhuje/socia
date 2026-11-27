"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import VideoMedia from "@/components/VideoMedia";

type SharedPost = {
  id: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  musicTitle: string | null;
  author: { fullName: string; username: string };
};
type Message = { id: string; senderId: string; body: string; createdAt: string | Date; readAt: string | Date | null; reactedByMe?: boolean; sharedPost?: SharedPost | null };
type ChatData = { messages: Message[]; error?: string };

export default function ChatThread({ conversationId, userId, otherUser }: { conversationId: string; userId: string; otherUser: { fullName: string; username: string; avatarUrl: string | null } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, { cache: "no-store" });
        const data = (await response.json()) as ChatData;
        if (!response.ok) throw new Error(data.error ?? "Could not load messages.");
        if (active) { setMessages(data.messages); setError(""); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load messages.");
      } finally { if (active) setLoading(false); }
    };
    void refresh();
    return () => { active = false; };
  }, [conversationId]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = body.trim();
    if (!clean || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: clean }) });
      const data = (await response.json()) as { message?: Message; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ?? "Could not send message.");
      setMessages((current) => [...current, data.message!]);
      setBody("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send message."); }
    finally { setSending(false); }
  }

  async function toggleReaction(messageId: string) {
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/reaction`, { method: "POST" });
      const data = (await response.json()) as { reacted?: boolean; error?: string };
      if (!response.ok || typeof data.reacted !== "boolean") throw new Error(data.error ?? "Could not react to message.");
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, reactedByMe: data.reacted } : message));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not react to message."); }
  }

  return <>
    <header className="flex items-center gap-3 border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-neutral-950">
      <Link href="/messages" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-200 dark:hover:bg-zinc-800" aria-label="Back to inbox">←</Link>
      <UserAvatar src={otherUser.avatarUrl} name={otherUser.fullName} sizeClass="h-10 w-10" />
      <div className="min-w-0 flex-1"><p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{otherUser.fullName}</p><p className="truncate text-xs text-zinc-500 dark:text-zinc-400">@{otherUser.username}</p></div>
      <button type="button" disabled title="Video calling is coming soon" aria-label="Video call, coming soon" className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 opacity-60 dark:text-zinc-400">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></svg>
      </button>
      <button type="button" disabled title="Voice calling is coming soon" aria-label="Voice call, coming soon" className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 opacity-60 dark:text-zinc-400">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 5a2 2 0 0 1 2-2h2l2 5-2 1a14 14 0 0 0 7 7l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 5z" /></svg>
      </button>
    </header>
    <section aria-label="Conversation messages" aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50 px-4 py-5 dark:bg-zinc-900">
      {loading && messages.length === 0 ? <p role="status" className="text-center text-sm text-zinc-500 dark:text-zinc-400">Loading conversation…</p> : null}
      {!loading && messages.length === 0 ? <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">This is the start of your conversation.</p> : null}
      {messages.map((message) => {
        const mine = message.senderId === userId;
        return <div key={message.id} className={`flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
          {!mine && <UserAvatar src={otherUser.avatarUrl} name={otherUser.fullName} sizeClass="h-7 w-7" />}
          <div className={`flex max-w-[82%] flex-col ${mine ? "items-end" : "items-start"}`}>
            <article className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? "rounded-br-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "rounded-bl-md border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"}`}>
              {message.sharedPost ? (
                <div className="w-full space-y-2">
                  <Link href={message.sharedPost.type === "video" ? `/video/${encodeURIComponent(message.sharedPost.id)}` : `/#post-${encodeURIComponent(message.sharedPost.id)}`} className="block rounded-xl border border-zinc-200 p-2 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-700">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{message.sharedPost.type} · @{message.sharedPost.author.username}</p>
                    {message.sharedPost.content && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.sharedPost.content}</p>}
                    {message.sharedPost.type === "image" && message.sharedPost.mediaUrl && <img src={message.sharedPost.mediaUrl} alt={message.sharedPost.content ?? "Shared post image"} className="mt-2 max-h-56 w-full rounded-lg object-cover" />}
                    {message.sharedPost.musicTitle && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">♪ {message.sharedPost.musicTitle}</p>}
                    <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">Open post →</p>
                  </Link>
                  {message.sharedPost.type === "video" && message.sharedPost.mediaUrl && <VideoMedia src={message.sharedPost.mediaUrl} title={message.sharedPost.content ?? `Video by ${message.sharedPost.author.fullName}`} className="max-h-56 w-full rounded-lg bg-black object-contain" />}
                </div>
              ) : message.body === "Shared a post" ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">This shared post is no longer available.</p>
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
              )}
              <time dateTime={new Date(message.createdAt).toISOString()} className={`mt-1 block text-right text-[10px] ${mine ? "text-zinc-300 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
            </article>
            <div className="flex items-center gap-2 px-1">
              <button type="button" onClick={() => void toggleReaction(message.id)} aria-label={message.reactedByMe ? "Remove heart reaction" : "React with heart"} aria-pressed={message.reactedByMe} className={`rounded-full px-1.5 py-1 text-sm transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-700 ${message.reactedByMe ? "text-rose-600" : "text-zinc-500 dark:text-zinc-400"}`}>♥</button>
              {mine && message.readAt && <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Seen</span>}
            </div>
          </div>
        </div>;
      })}
      <div ref={bottom} />
    </section>
    {error && <p role="alert" className="bg-white px-4 py-2 text-sm text-red-600 dark:bg-neutral-950 dark:text-red-400">{error}</p>}
    <form onSubmit={send} className="flex gap-2 border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-neutral-950">
      <label htmlFor="chat-message" className="sr-only">Message</label>
      <input id="chat-message" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Message…" className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950" />
      <button type="submit" disabled={!body.trim() || sending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400">{sending ? "Sending…" : "Send"}</button>
    </form>
  </>;
}
