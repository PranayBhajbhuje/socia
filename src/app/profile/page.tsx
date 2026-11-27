import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import FollowButton from "@/components/FollowButton";
import DeletePostButton from "@/components/DeletePostButton";
import StartConversationButton from "@/components/StartConversationButton";
import SettingsLink from "@/components/SettingsLink";
import VideoMedia from "@/components/VideoMedia";
import UserAvatar from "@/components/UserAvatar";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ tab?: string }>;
  params: Promise<{ username?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [{ tab: requestedTab }, { username }, currentUser] = await Promise.all([
    searchParams,
    params,
    db.orm.User.where({ id: session.userId }).first(),
  ]);
  const isOwnProfile = !username || username === currentUser?.username;
  const user = isOwnProfile ? currentUser : await db.orm.User.where({ username: username! }).first();
  if (!user) redirect("/people");

  const [userPosts, following, followers, relationship] = await Promise.all([
    db.orm.Post.where({ authorId: user.id }).orderBy((post) => post.createdAt.desc()).all(),
    db.orm.Follow.where({ followerId: user.id }).all(),
    db.orm.Follow.where({ followingId: user.id }).all(),
    isOwnProfile ? Promise.resolve(null) : db.orm.Follow.where({ followerId: session.userId, followingId: user.id }).first(),
  ]);
  const tab = ["post", "video", "tag"].includes(requestedTab ?? "") ? requestedTab! : "post";
  const videoPosts = userPosts.filter((post) => post.type === "video");
  const videoViewRows = tab === "video"
    ? await Promise.all(videoPosts.map((post) => db.orm.VideoView.where({ postId: post.id }).all().then((views) => [post.id, views.length] as const)))
    : [];
  const videoViewCounts = new Map(videoViewRows);

  return (
    <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white dark:bg-neutral-950">
        <div>
          <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{isOwnProfile ? "Profile" : `@${user.username}`}</h1>
            {isOwnProfile ? <SettingsLink /> : <div className="flex items-center gap-2"><StartConversationButton userId={user.id} /><FollowButton userId={user.id} initialFollowing={Boolean(relationship)} /></div>}
          </header>

          <section className="mx-4 my-4 rounded-3xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <UserAvatar src={user.avatarUrl} name={user.fullName} sizeClass="h-16 w-16" textClass="text-xl" className="bg-zinc-900 text-white dark:bg-zinc-800" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">{user.fullName}</h2>
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
              </div>
            </div>

            {user.bio && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{user.bio}</p>}
            {user.websiteUrl && <a href={user.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{user.websiteUrl}</a>}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Link href={`/profile/${encodeURIComponent(user.username)}/following`} className="rounded-2xl border border-zinc-200 bg-white px-1 py-2.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{following.length}</p><p className="text-xs text-zinc-500 dark:text-zinc-400">Following</p>
              </Link>
              <Link href={`/profile/${encodeURIComponent(user.username)}/followers`} className="rounded-2xl border border-zinc-200 bg-white px-1 py-2.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{followers.length}</p><p className="text-xs text-zinc-500 dark:text-zinc-400">Followers</p>
              </Link>
              <div className="rounded-2xl border border-zinc-200 bg-white px-1 py-2.5 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{userPosts.length}</p><p className="text-xs text-zinc-500 dark:text-zinc-400">Posts</p>
              </div>
            </div>
          </section>

          <nav aria-label="Profile posts" className="mx-4 grid grid-cols-3 rounded-full bg-zinc-100 p-1 text-center text-sm font-medium dark:bg-zinc-900">
            {(["post", "video", "tag"] as const).map((name) => (
              <Link key={name} href={`/profile/${encodeURIComponent(user.username)}?tab=${name}`} aria-current={tab === name ? "page" : undefined} className={`rounded-full py-2.5 capitalize transition-colors ${tab === name ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"}`}>
                {name === "tag" ? "Tagged" : name}
              </Link>
            ))}
          </nav>

          <section aria-label={`${tab === "tag" ? "Tagged" : tab === "video" ? "Video" : "Post"} content`} className="p-4">
            {tab === "tag" ? (
              <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No tagged posts yet.</p>
            ) : (tab === "video" ? videoPosts : userPosts).length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No {tab === "video" ? "videos" : "posts"} yet.</p>
            ) : tab === "video" ? (
              <div className="grid grid-cols-2 gap-3">
                {videoPosts.map((post) => (
                  <article key={post.id} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
                    {post.mediaUrl && <VideoMedia src={post.mediaUrl} title={post.content ?? `Video by ${user.fullName}`} className="aspect-[4/5] w-full bg-black object-cover" />}
                    <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white">◉ {videoViewCounts.get(post.id) ?? 0}</span>
                    {post.content && <p className="line-clamp-2 p-2 text-xs text-white">{post.content}</p>}
                    {isOwnProfile && <DeletePostButton postId={post.id} type="video" />}
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {userPosts.map((post) => (
                  <article key={post.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-neutral-950">
                    <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400"><span className="rounded-full bg-zinc-100 px-2 py-1 uppercase dark:bg-zinc-900">{post.type}</span><time dateTime={post.createdAt.toISOString()}>{post.createdAt.toLocaleDateString()}</time></div>
                    {isOwnProfile && <DeletePostButton postId={post.id} type={post.type} />}
                    {post.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">{post.content}</p>}
                    {post.type === "video" && post.mediaUrl && <VideoMedia src={post.mediaUrl} title={post.content ?? `Video by ${user.fullName}`} className="mt-3 max-h-80 w-full rounded-xl bg-black" />}
                    {post.type === "image" && post.mediaUrl && <img src={post.mediaUrl} alt={post.content ?? "Post image"} className="mt-3 max-h-80 w-full rounded-xl object-cover" />}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        <BottomNav />
      </div>
    </main>
  );
}
