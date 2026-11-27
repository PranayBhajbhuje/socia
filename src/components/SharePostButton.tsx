"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

interface ShareRecipient {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  conversationId: string | null;
}

interface ConversationResponse {
  conversations?: Array<{
    id: string;
    otherUser: { id: string; fullName: string; username: string; avatarUrl: string | null };
  }>;
  error?: string;
}

interface UserResponse {
  users?: Array<{
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
    isFollowing: boolean;
  }>;
  error?: string;
}

export function ShareIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" /></svg>;
}

export default function SharePostButton({
  post,
  children,
  className,
  ariaLabel = "Share post",
}: {
  post: { id: string; type: string; authorName: string };
  children: ReactNode;
  className: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<ShareRecipient[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [addingToStory, setAddingToStory] = useState(false);
  const [addedToStory, setAddedToStory] = useState(false);
  const [error, setError] = useState("");
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sendingTo && !addingToStory) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, sendingTo, addingToStory]);

  async function openShareDialog() {
    setOpen(true);
    setLoading(true);
    setError("");
    setShareLink("");
    setAddedToStory(false);
    try {
      const [conversationResponse, userResponse] = await Promise.all([
        fetch("/api/conversations", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ]);
      const [conversationData, userData] = await Promise.all([
        conversationResponse.json() as Promise<ConversationResponse>,
        userResponse.json() as Promise<UserResponse>,
      ]);
      if (!conversationResponse.ok) throw new Error(conversationData.error ?? "Could not load conversations.");
      if (!userResponse.ok) throw new Error(userData.error ?? "Could not load friends.");

      const byId = new Map<string, ShareRecipient>();
      for (const conversation of conversationData.conversations ?? []) {
        byId.set(conversation.otherUser.id, {
          ...conversation.otherUser,
          conversationId: conversation.id,
        });
      }
      for (const user of userData.users ?? []) {
        if (!user.isFollowing) continue;
        const existing = byId.get(user.id);
        byId.set(user.id, {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          conversationId: existing?.conversationId ?? null,
        });
      }
      setRecipients([...byId.values()].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load people to share with.");
    } finally {
      setLoading(false);
    }
  }

  async function addToStory() {
    if (addingToStory || addedToStory || sendingTo) return;
    setAddingToStory(true);
    setError("");
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not add this post to your story.");
      setAddedToStory(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this post to your story.");
    } finally {
      setAddingToStory(false);
    }
  }

  async function sendTo(recipient: ShareRecipient) {
    if (sendingTo || addingToStory) return;
    setSendingTo(recipient.id);
    setError("");
    try {
      let conversationId = recipient.conversationId;
      if (!conversationId) {
        const conversationResponse = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: recipient.id }),
        });
        const conversationData = await conversationResponse.json() as { conversationId?: string; error?: string };
        if (!conversationResponse.ok || !conversationData.conversationId) {
          throw new Error(conversationData.error ?? "Could not open this conversation.");
        }
        conversationId = conversationData.conversationId;
      }

      const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharePostId: post.id }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not share this post.");
      setOpen(false);
      router.push(`/messages/${encodeURIComponent(conversationId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not share this post.");
    } finally {
      setSendingTo(null);
    }
  }

  async function shareLinkExternally() {
    const url = new URL(
      post.type === "video" ? `/video/${encodeURIComponent(post.id)}` : `/#post-${encodeURIComponent(post.id)}`,
      window.location.origin,
    ).toString();
    setError("");
    if (navigator.share) {
      try {
        await navigator.share({ title: `${post.authorName} on Socia`, url });
        setOpen(false);
        return;
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLink("Post link copied.");
    } catch {
      setShareLink(url);
    }
  }

  return (
    <>
      <button type="button" onClick={() => void openShareDialog()} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} className={className}>
        {children}
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !sendingTo && !addingToStory) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="share-post-title" className="flex max-h-[82dvh] w-full max-w-md flex-col rounded-t-3xl bg-white text-neutral-900 shadow-2xl dark:bg-neutral-950 dark:text-neutral-100 sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <h2 id="share-post-title" className="font-bold">Share post</h2>
              <button type="button" onClick={() => setOpen(false)} disabled={Boolean(sendingTo) || addingToStory} aria-label="Close share dialog" className="rounded-full px-3 py-1 text-xl text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800">×</button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              <p className="py-3 text-sm text-neutral-500 dark:text-neutral-400">Send directly to a friend</p>
              {loading ? <p role="status" className="py-6 text-center text-sm text-neutral-500">Loading friends…</p> : recipients.length ? (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {recipients.map((recipient) => (
                    <li key={recipient.id} className="flex items-center gap-3 py-3">
                      <UserAvatar src={recipient.avatarUrl} name={recipient.fullName} sizeClass="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{recipient.fullName}</p>
                        <p className="truncate text-xs text-neutral-500">@{recipient.username}</p>
                      </div>
                      <button type="button" onClick={() => void sendTo(recipient)} disabled={Boolean(sendingTo) || addingToStory} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                        {sendingTo === recipient.id ? "Sending…" : "Send"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : !loading ? (
                <div className="py-5 text-center">
                  <p className="text-sm text-neutral-500">No friends or conversations to share with yet.</p>
                  <Link href="/people" onClick={() => setOpen(false)} className="mt-3 inline-block rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800">Find people</Link>
                </div>
              ) : null}
              {error && <p role="alert" className="py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              {shareLink && (shareLink.startsWith("http") ? <input aria-label="Share link" readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} className="my-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900" /> : <p role="status" className="py-2 text-sm text-green-700 dark:text-green-400">{shareLink}</p>)}
            </div>
            <footer className="border-t border-neutral-100 p-4 dark:border-neutral-800">
              <button type="button" onClick={() => void addToStory()} disabled={addingToStory || addedToStory || Boolean(sendingTo)} className="mb-2 w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {addedToStory ? "Added to your story" : addingToStory ? "Adding to story…" : "Add to your story"}
              </button>
              {addedToStory && <p role="status" className="mb-2 text-center text-xs text-green-700 dark:text-green-400">This story will be available for 24 hours.</p>}
              <button type="button" onClick={() => void shareLinkExternally()} disabled={addingToStory || Boolean(sendingTo)} className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900">
                Share link instead
              </button>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
