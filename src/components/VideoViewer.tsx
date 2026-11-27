"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import BookmarkButton from "@/components/BookmarkButton";
import VideoMedia from "@/components/VideoMedia";
import UserAvatar from "@/components/UserAvatar";
import SharePostButton from "@/components/SharePostButton";
import PostOptionsMenu from "@/components/PostOptionsMenu";

type Comment = { id: string; postId: string; authorId: string; parentId: string | null; body: string; createdAt: string | Date; author: string; fullName: string; likeCount: number; likedByMe: boolean; replies: Comment[] };

export default function VideoViewer({ post, currentUserId, initialLiked, initialLikeCount, initialViewCount, initialCommentCount }: { post: { id: string; authorId: string; type: string; content: string | null; mediaUrl: string | null; musicTitle: string | null; author: { fullName: string; username: string; avatarUrl: string | null } }; currentUserId: string | null; initialLiked: boolean; initialLikeCount: number; initialViewCount: number; initialCommentCount: number }) {
  const router = useRouter();
  const [caption, setCaption] = useState(post.content);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [viewCount] = useState(initialViewCount);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  function closeViewer() {
    if (document.referrer.startsWith(window.location.origin)) router.back();
    else router.push("/");
  }

  useEffect(() => {
    if (!commentsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCommentsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [commentsOpen]);

  async function toggleLike() {
    const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/like`, { method: "POST" });
    const data = (await response.json()) as { liked?: boolean; likeCount?: number; error?: string };
    if (!response.ok || typeof data.liked !== "boolean") { setError(data.error ?? "Could not update like."); return; }
    setLiked(data.liked);
    setLikeCount(data.likeCount ?? likeCount);
  }

  async function openComments() {
    setCommentsOpen(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, { cache: "no-store" });
      const data = await response.json() as { comments?: Comment[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load comments.");
      setComments(data.comments ?? []);
      setCommentCount((data.comments ?? []).reduce((count, item) => count + 1 + item.replies.length, 0));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load comments."); }
  }

  async function sendComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = comment.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, parentId: replyTo?.id }) });
      const data = await response.json() as { comment?: { id: string; postId: string; authorId: string; parentId: string | null; body: string; createdAt: string }; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error ?? "Could not post comment.");
      const created: Comment = { ...data.comment, author: "you", fullName: "You", likeCount: 0, likedByMe: false, replies: [] };
      setComments((current) => replyTo ? current.map((item) => item.id === replyTo.id ? { ...item, replies: [...item.replies, created] } : item) : [...current, created]);
      setCommentCount((count) => count + 1);
      setComment("");
      setReplyTo(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not post comment."); }
    finally { setBusy(false); }
  }

  async function likeComment(item: Comment) {
    const response = await fetch(`/api/comments/${encodeURIComponent(item.id)}/like`, { method: "POST" });
    const data = await response.json() as { liked?: boolean; likeCount?: number; error?: string };
    if (!response.ok || typeof data.liked !== "boolean") { setError(data.error ?? "Could not like comment."); return; }
    const update = (target: Comment): Comment => target.id === item.id ? { ...target, likedByMe: data.liked!, likeCount: data.likeCount ?? target.likeCount } : { ...target, replies: target.replies.map(update) };
    setComments((current) => current.map(update));
  }

  async function deleteComment(item: Comment) {
    if (deletingCommentId || !window.confirm("Delete this comment? This cannot be undone.")) return;
    setDeletingCommentId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const data = await response.json() as { deletedCount?: number; error?: string };
      if (!response.ok || typeof data.deletedCount !== "number") throw new Error(data.error ?? "Could not delete comment.");
      setComments((current) => current.filter((comment) => comment.id !== item.id).map((comment) => ({
        ...comment,
        replies: comment.replies.filter((reply) => reply.id !== item.id),
      })));
      setCommentCount((count) => Math.max(0, count - data.deletedCount!));
      if (replyTo?.id === item.id) setReplyTo(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete comment.");
    } finally {
      setDeletingCommentId(null);
    }
  }

  function renderComment(item: Comment, nested = false) {
    return <article key={item.id} className={`${nested ? "ml-5 border-l border-zinc-200 pl-3 dark:border-zinc-700" : "border-b border-zinc-100 dark:border-zinc-800"} py-3`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-zinc-900 dark:text-zinc-100"><span className="font-semibold">{item.fullName}</span> {item.body}</p>
        {item.authorId === currentUserId && <button type="button" onClick={() => void deleteComment(item)} disabled={deletingCommentId === item.id} aria-label="Delete comment" className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40">{deletingCommentId === item.id ? "Deleting…" : "Delete"}</button>}
      </div>
      <div className="mt-1 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400"><button type="button" onClick={() => void likeComment(item)} aria-pressed={item.likedByMe} className="rounded px-1 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{item.likedByMe ? "♥" : "♡"} {item.likeCount}</button>{!nested && <button type="button" onClick={() => setReplyTo(item)} className="rounded px-1 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-white">Reply</button>}</div>
      {(item.replies ?? []).map((reply) => renderComment(reply, true))}
    </article>;
  }

  return <div className="relative flex min-h-[80dvh] flex-1 flex-col justify-center bg-black text-white">
    <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
      <button type="button" onClick={closeViewer} className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-sm font-medium text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close video"><span aria-hidden="true">×</span><span>Video</span></button>
      <span className="rounded-full bg-black/50 px-3 py-1.5 text-sm">{viewCount} views</span>
    </header>
    {post.mediaUrl && <VideoMedia src={post.mediaUrl} title={caption ?? `Video by ${post.author.fullName}`} className="max-h-[70dvh] aspect-video w-full bg-black object-contain" />}
    <section className="mt-auto space-y-2 p-4">
      <div className="flex items-center gap-2"><UserAvatar src={post.author.avatarUrl} name={post.author.fullName} sizeClass="h-10 w-10" /><p className="font-semibold">{post.author.fullName} <span className="font-normal text-white/70">@{post.author.username}</span></p></div>
      {caption && <p className="text-sm leading-relaxed">{caption}</p>}
      {post.musicTitle && <p className="text-xs text-white/70">♪ {post.musicTitle}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {currentUserId ? <>
          <button type="button" onClick={() => void toggleLike()} aria-pressed={liked} className="rounded-full bg-white/15 px-3 py-2 text-sm transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{liked ? "♥" : "♡"} {likeCount}</button>
          <button type="button" onClick={() => void openComments()} className="rounded-full bg-white/15 px-3 py-2 text-sm transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Comments {commentCount}</button>
          <BookmarkButton postId={post.id} initialBookmarked={false} />
        </> : <><span className="text-sm text-white/80">{likeCount} likes · {initialCommentCount} comments</span><a href="/login" className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25">Sign in to interact</a></>}
        {currentUserId === post.authorId && <PostOptionsMenu postId={post.id} type={post.type} content={caption} onCaptionUpdated={setCaption} />}
        <SharePostButton post={{ id: post.id, type: post.type, authorName: post.author.fullName }} className="rounded-full bg-white/15 px-3 py-2 text-sm transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Share</SharePostButton>
      </div>
    </section>
    {error && !commentsOpen && <p role="status" className="px-4 pb-2 text-sm text-amber-200">{error}</p>}
    {commentsOpen && <div className="fixed inset-0 z-30 flex items-end bg-black/65" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommentsOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="video-comments-title" className="flex max-h-[82dvh] w-full flex-col rounded-t-3xl bg-white text-zinc-900 shadow-2xl dark:bg-zinc-950 dark:text-zinc-100">
        <div className="flex justify-center pt-3"><span aria-hidden="true" className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" /></div>
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800"><h2 id="video-comments-title" className="font-bold">{commentCount} Comments</h2><button type="button" onClick={() => setCommentsOpen(false)} aria-label="Close comments" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800">×</button></header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">{comments.map((item) => renderComment(item))}{!comments.length && <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Be the first to comment.</p>}{error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}</div>
        <form onSubmit={sendComment} className="border-t border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          {replyTo && <div className="mb-2 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400"><span>Replying to <span className="font-semibold">{replyTo.fullName}</span></span><button type="button" onClick={() => setReplyTo(null)} className="rounded px-2 py-1 font-medium hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800">Cancel reply</button></div>}
          <div className="flex gap-2"><label htmlFor="video-comment" className="sr-only">{replyTo ? `Reply to ${replyTo.fullName}` : "Write a comment"}</label><input id="video-comment" maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={replyTo ? `Reply to ${replyTo.fullName}…` : "Add a comment…"} className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950" /><button disabled={busy || !comment.trim()} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Posting…" : replyTo ? "Reply" : "Post"}</button></div>
        </form>
      </section>
    </div>}
  </div>;
}
