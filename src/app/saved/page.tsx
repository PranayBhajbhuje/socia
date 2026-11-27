import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import { FeedCard, type FeedPostItem } from "@/components/FeedCard";

export const dynamic = "force-dynamic";
export default async function SavedPage() {
  const session = await getSessionUser(); if (!session) redirect("/login");
  const bookmarks = await db.orm.PostBookmark.where({ userId: session.userId }).orderBy((bookmark) => bookmark.createdAt.desc()).all();
  const rows = await Promise.all(bookmarks.map((bookmark) => db.orm.Post.where({ id: bookmark.postId }).include("author").include("likes").first()));
  const posts: FeedPostItem[] = rows.filter((post) => post !== null).map((post) => ({ id: post.id, type: post.type, content: post.content, mediaUrl: post.mediaUrl, musicTitle: post.musicTitle, createdAt: post.createdAt.toISOString(), author: { fullName: post.author.fullName, username: post.author.username, avatarUrl: post.author.avatarUrl }, likeCount: post.likes.length, likedByMe: post.likes.some((like) => like.userId === session.userId), isMine: post.authorId === session.userId, isBookmarked: true }));
  return <main className="flex min-h-screen justify-center bg-zinc-50"><div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white"><section className="flex-1"><header className="border-b border-zinc-100 px-5 py-4"><Link href="/settings" className="text-sm text-zinc-500">← Settings</Link><h1 className="mt-2 text-xl font-bold text-zinc-900">Saved posts</h1></header>{posts.length ? posts.map((post) => <FeedCard key={post.id} post={post} />) : <p className="py-16 text-center text-sm text-zinc-500">Posts you save will appear here.</p>}</section><BottomNav /></div></main>;
}
