"use client";

import { useState, type FormEvent } from "react";
import BookmarkButton from "@/components/BookmarkButton";
import VideoMedia from "@/components/VideoMedia";
import UserAvatar from "@/components/UserAvatar";
import SharePostButton, { ShareIcon } from "@/components/SharePostButton";
import PostOptionsMenu from "@/components/PostOptionsMenu";

export interface FeedPostItem {
  id: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  musicTitle: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  isMine: boolean;
  isBookmarked: boolean;
  author: {
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface FeedComment {
  id: string;
  authorId: string;
  parentId: string | null;
  body: string;
  author: string;
  fullName: string;
  replies: FeedComment[];
}

function EngagementButton({
  icon,
  label,
  count,
  onClick,
  pressed,
  vertical = false,
}: {
  icon: "like" | "comment";
  label: string;
  count?: number;
  onClick: () => void;
  pressed?: boolean;
  vertical?: boolean;
}) {
  const paths = {
    like: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z",
    comment: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count === undefined ? label : `${label}, ${count}`}
      aria-pressed={pressed}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        vertical
          ? "min-h-12 min-w-12 flex-col gap-0 rounded-full bg-black/55 px-2 py-1.5 text-white hover:bg-black/75"
          : `px-3 py-1.5 text-sm ${pressed ? "text-rose-600 dark:text-rose-400" : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"}`
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill={icon === "like" && pressed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d={paths[icon]} />
      </svg>
      {count !== undefined && <span className={vertical ? "text-[10px] leading-3" : "text-xs"}>{count}</span>}
    </button>
  );
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

export function FeedCard({ post, currentUserId }: { post: FeedPostItem; currentUserId: string }) {
  const [caption, setCaption] = useState(post.content);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

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

  async function openComments() {
    setCommentsOpen(true);
    setCommentsLoading(true);
    setCommentError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, { cache: "no-store" });
      const data = await response.json() as { comments?: FeedComment[]; error?: string };
      if (!response.ok || !data.comments) throw new Error(data.error ?? "Could not load comments.");
      setComments(data.comments);
      setCommentCount(data.comments.reduce((count, item) => count + 1 + item.replies.length, 0));
    } catch (cause) {
      setCommentError(cause instanceof Error ? cause.message : "Could not load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = commentText.trim();
    if (!body || commentBusy) return;
    setCommentBusy(true);
    setCommentError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId: replyTo?.id }),
      });
      const data = await response.json() as { comment?: { id: string; parentId: string | null; body: string }; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error ?? "Could not post comment.");
      const created: FeedComment = { ...data.comment, authorId: currentUserId, author: "you", fullName: "You", replies: [] };
      setComments((current) => replyTo
        ? current.map((item) => item.id === replyTo.id ? { ...item, replies: [...item.replies, created] } : item)
        : [...current, created]);
      setCommentCount((count) => count + 1);
      setCommentText("");
      setReplyTo(null);
    } catch (cause) {
      setCommentError(cause instanceof Error ? cause.message : "Could not post comment.");
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleDeleteComment(comment: FeedComment) {
    if (deletingCommentId || !window.confirm("Delete this comment? This cannot be undone.")) return;
    setDeletingCommentId(comment.id);
    setCommentError("");
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(comment.id)}`, { method: "DELETE" });
      const data = await response.json() as { deletedCount?: number; error?: string };
      if (!response.ok || typeof data.deletedCount !== "number") throw new Error(data.error ?? "Could not delete comment.");
      setComments((current) => current.filter((item) => item.id !== comment.id).map((item) => ({
        ...item,
        replies: item.replies.filter((reply) => reply.id !== comment.id),
      })));
      setCommentCount((count) => Math.max(0, count - data.deletedCount!));
      if (replyTo?.id === comment.id) setReplyTo(null);
    } catch (cause) {
      setCommentError(cause instanceof Error ? cause.message : "Could not delete comment.");
    } finally {
      setDeletingCommentId(null);
    }
  }

  function renderComment(item: FeedComment, nested = false) {
    return (
      <article key={item.id} className={`${nested ? "ml-4 border-l border-neutral-200 pl-3 dark:border-neutral-700" : "border-b border-neutral-100 dark:border-neutral-800"} py-3`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed"><span className="font-semibold">{item.fullName}</span> {item.body}</p>
          {item.authorId === currentUserId && (
            <button type="button" onClick={() => void handleDeleteComment(item)} disabled={deletingCommentId === item.id} aria-label="Delete comment" className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40">
              {deletingCommentId === item.id ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
        {!nested && (
          <button type="button" onClick={() => { setReplyTo(item); setCommentError(""); }} className="mt-1 rounded px-1 py-0.5 text-xs font-medium text-neutral-500 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-400 dark:hover:text-blue-400">
            Reply
          </button>
        )}
        {(item.replies ?? []).map((reply) => renderComment(reply, true))}
      </article>
    );
  }

  return (
    <article id={`post-${post.id}`} className="mx-3 mb-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
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
        {post.isMine && <PostOptionsMenu postId={post.id} type={post.type} content={caption} onCaptionUpdated={setCaption} />}
      </div>

      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}

      {caption && (
        <p className="mt-2.5 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {caption}
        </p>
      )}

      {post.type === "image" && post.mediaUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <img
            src={post.mediaUrl}
            alt={caption ?? "Post image"}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
      )}

      {post.type === "video" && post.mediaUrl && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-black dark:border-neutral-800">
          <VideoMedia src={post.mediaUrl} title={caption ?? `Video by ${post.author.fullName}`} className="aspect-[4/5] w-full bg-black object-contain" />
          <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2">
            <EngagementButton icon="like" label={liked ? "Unlike post" : "Like post"} count={likeCount} onClick={() => void handleToggleLike()} pressed={liked} vertical />
            <EngagementButton icon="comment" label="Comments" count={commentCount} onClick={() => void openComments()} vertical />
            <SharePostButton post={{ id: post.id, type: post.type, authorName: post.author.fullName }} className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/55 px-2 py-1.5 text-white transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <ShareIcon />
            </SharePostButton>
            <BookmarkButton
              postId={post.id}
              initialBookmarked={post.isBookmarked}
              iconOnly
              className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            />
          </div>
        </div>
      )}

      {post.musicTitle && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          <span aria-hidden="true">♪</span>
          <span className="truncate">{post.musicTitle}</span>
        </div>
      )}

      {post.type !== "video" && (
        <div className="mt-3 flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <EngagementButton icon="like" label={liked ? "Unlike post" : "Like post"} count={likeCount} onClick={() => void handleToggleLike()} pressed={liked} />
            <EngagementButton icon="comment" label="Comments" count={commentCount} onClick={() => void openComments()} />
            <SharePostButton post={{ id: post.id, type: post.type, authorName: post.author.fullName }} className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800">
              <ShareIcon />
            </SharePostButton>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton
              postId={post.id}
              initialBookmarked={post.isBookmarked}
              iconOnly
              className="rounded-full p-2 text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
            />
            <time dateTime={post.createdAt} className="text-[11px] text-neutral-500">
              {formatPostTime(post.createdAt)}
            </time>
          </div>
        </div>
      )}
      {post.type === "video" && <time dateTime={post.createdAt} className="mt-2 block text-right text-[11px] text-neutral-500">{formatPostTime(post.createdAt)}</time>}
      {commentsOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommentsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby={`comments-title-${post.id}`} className="flex max-h-[82dvh] w-full max-w-md flex-col rounded-t-3xl bg-white text-neutral-900 shadow-2xl dark:bg-neutral-950 dark:text-neutral-100 sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <h2 id={`comments-title-${post.id}`} className="font-bold">{commentCount} Comments</h2>
              <button type="button" onClick={() => setCommentsOpen(false)} aria-label="Close comments" className="rounded-full px-3 py-1 text-xl text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800">×</button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              {commentsLoading ? <p className="py-8 text-center text-sm text-neutral-500">Loading comments…</p> : comments.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">Be the first to comment.</p> : comments.map((item) => renderComment(item))}
              {commentError && <p role="alert" className="py-2 text-sm text-red-600 dark:text-red-400">{commentError}</p>}
            </div>
            <form onSubmit={handleComment} className="border-t border-neutral-100 p-4 dark:border-neutral-800">
              {replyTo && <div className="mb-2 flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400"><span>Replying to <span className="font-semibold">{replyTo.fullName}</span></span><button type="button" onClick={() => setReplyTo(null)} className="rounded px-2 py-1 font-medium hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800">Cancel reply</button></div>}
              <div className="flex gap-2">
                <label htmlFor={`comment-${post.id}`} className="sr-only">{replyTo ? `Reply to ${replyTo.fullName}` : "Write a comment"}</label>
                <input id={`comment-${post.id}`} maxLength={1000} value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={replyTo ? `Reply to ${replyTo.fullName}…` : "Add a comment…"} className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-blue-950" />
                <button type="submit" disabled={commentBusy || !commentText.trim()} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{commentBusy ? "Posting…" : replyTo ? "Reply" : "Post"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </article>
  );
}
