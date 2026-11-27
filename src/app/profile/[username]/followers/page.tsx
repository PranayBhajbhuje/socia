import FollowList from "../_FollowList";

export const dynamic = "force-dynamic";

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <FollowList username={username} type="followers" />;
}
