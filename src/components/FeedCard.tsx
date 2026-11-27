"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BookmarkButton from "@/components/BookmarkButton";
import VideoMedia from "@/components/VideoMedia";
import UserAvatar from "@/components/UserAvatar";

export interface FeedPostItem {
  id: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  musicTitle: string | null;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  isBookmarked: boolean;
  author: {
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
}

function formatPostTime(value: string) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d ago`;
  return new Date(value).toLocaleDateString();
}

export function FeedCard({ post }: { post: FeedPostItem }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting || !window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not delete this post.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this post.");
      setDeleting(false);
    }
  }

  async function handleToggleLike() {
    if (pending) return;
    setPending(true);
    setError("");

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Like toggle failed");
      const data: { liked: boolean; likeCount: number } = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      setError("Could not update like. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="mx-3 mb-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <UserAvatar src={post.author.avatarUrl} name={post.author.fullName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {post.author.fullName}
          </p>
          <p className="truncate text-xs text-neutral-500">@{post.author.username}</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
          {post.type}
        </span>
        {post.isMine && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Post options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={deleting}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-semibold leading-none text-neutral-600 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <span aria-hidden="true">⋯</span>
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-full z-20 mt-1 min-w-36 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); void handleDelete(); }}
                  disabled={deleting}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  {deleting ? "Deleting…" : "Delete post"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}

      {post.content && (
        <p className="mt-2.5 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {post.content}
        </p>
      )}

      {post.type === "image" && post.mediaUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <img
            src={post.mediaUrl}
            alt={post.content ?? "Post image"}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
      )}

      {post.type === "video" && post.mediaUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-black dark:border-neutral-800">
          <VideoMedia src={post.mediaUrl} title={post.content ?? `Video by ${post.author.fullName}`} className="aspect-[4/5] w-full bg-black object-contain" />
        </div>
      )}

      {post.musicTitle && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          <span aria-hidden="true">♪</span>
          <span className="truncate">{post.musicTitle}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            liked
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          <span>{liked ? "♥" : "♡"}</span>
          <span>{likeCount}</span>
        </button>

        <BookmarkButton postId={post.id} initialBookmarked={post.isBookmarked} />

        <time dateTime={post.createdAt} className="text-[11px] text-neutral-500">
          {formatPostTime(post.createdAt)}
        </time>
      </div>
    </article>
  );
}
