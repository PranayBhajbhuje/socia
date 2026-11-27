import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to find people." }, { status: 401 });

  const [users, follows] = await Promise.all([
    db.orm.User.all(),
    db.orm.Follow.where({ followerId: session.userId }).all(),
  ]);
  const followedIds = new Set(follows.map((follow) => follow.followingId));

  return NextResponse.json({
    users: users
      .filter((user) => user.id !== session.userId)
      .map((user) => ({
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        bio: user.bio,
        isFollowing: followedIds.has(user.id),
      })),
  });
}
