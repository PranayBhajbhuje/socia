import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import { FeedCard, type FeedPostItem } from "@/components/FeedCard";
import AppHeader from "@/components/AppHeader";
import StoryRail from "@/components/StoryRail";
import { currentTimeMs } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { tab } = await searchParams;
  const videoMode = tab === "video";

  const rows = await db.orm.Post
    .orderBy((post) => post.createdAt.desc())
    .include("author")
    .include("likes")
    .all();
  const bookmarks = await db.orm.PostBookmark.where({ userId: session.userId }).all();
  const bookmarkedPostIds = new Set(bookmarks.map((bookmark) => bookmark.postId));
  const [storyRows, storyViews] = await Promise.all([
    db.orm.Story.include("user").all(),
    db.orm.StoryView.where({ userId: session.userId }).all(),
  ]);
  const viewedStoryIds = new Set(storyViews.map((view) => view.storyId));
  const renderTime = currentTimeMs();
  const stories = storyRows.filter((story) => story.expiresAt.getTime() > renderTime).map((story) => ({ id: story.id, userId: story.userId, mediaUrl: story.mediaUrl, caption: story.caption, expiresAt: story.expiresAt.toISOString(), viewed: viewedStoryIds.has(story.id), user: { fullName: story.user.fullName, username: story.user.username, avatarUrl: story.user.avatarUrl } }));

  const allPosts: FeedPostItem[] = rows.map((post) => ({
    id: post.id,
    type: post.type,
    content: post.content,
    mediaUrl: post.mediaUrl,
    musicTitle: post.musicTitle,
    createdAt: post.createdAt.toISOString(),
    author: {
      fullName: post.author.fullName,
      username: post.author.username,
      avatarUrl: post.author.avatarUrl,
    },
    likeCount: post.likes.length,
    likedByMe: post.likes.some((like) => like.userId === session.userId),
    isMine: post.authorId === session.userId,
    isBookmarked: bookmarkedPostIds.has(post.id),
  }));
  const posts = videoMode ? allPosts.filter((post) => post.type === "video") : allPosts;

  return (
    <main className="flex min-h-screen justify-center bg-zinc-50">
      <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white">
        <div>
          <AppHeader username={session.username} postCount={posts.length} />

          {!videoMode && <StoryRail stories={stories} currentUserId={session.userId} />}

          <section aria-label={videoMode ? "Video posts" : "Posts"} className="py-3">
            {posts.length === 0 ? (
              <p className="py-16 text-center text-sm text-zinc-500">No posts yet. Share your first post.</p>
            ) : posts.map((post) => <FeedCard key={post.id} post={post} />)}
          </section>
        </div>
        <BottomNav />
      </div>
    </main>
  );
}
