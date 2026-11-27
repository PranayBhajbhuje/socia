import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import VideoViewer from "@/components/VideoViewer";

export const dynamic = "force-dynamic";
export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  const { id } = await params;
  const post = await db.orm.Post.where({ id }).include("author").include("likes").first();
  if (!post || post.type !== "video" || !post.mediaUrl) notFound();
  const [view, views, comments] = await Promise.all([
    session ? db.orm.VideoView.where({ userId: session.userId, postId: id }).first() : Promise.resolve(null),
    db.orm.VideoView.where({ postId: id }).all(),
    db.orm.PostComment.where({ postId: id }).all(),
  ]);
  if (session && !view) await db.orm.VideoView.create({ userId: session.userId, postId: id });
  return <main className="flex min-h-screen justify-center bg-black"><div className="flex min-h-screen w-full max-w-md flex-col bg-black"><VideoViewer post={{ id: post.id, authorId: post.authorId, type: post.type, content: post.content, mediaUrl: post.mediaUrl, musicTitle: post.musicTitle, author: { fullName: post.author.fullName, username: post.author.username, avatarUrl: post.author.avatarUrl } }} currentUserId={session?.userId ?? null} initialLiked={Boolean(session && post.likes.some((like) => like.userId === session.userId))} initialLikeCount={post.likes.length} initialViewCount={views.length + (session && !view ? 1 : 0)} initialCommentCount={comments.length} /><BottomNav /></div></main>;
}
