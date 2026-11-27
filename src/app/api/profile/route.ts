import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import { isUniqueViolation } from "@/lib/errors";

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to edit your profile." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid profile update." }, { status: 400 }); }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const websiteUrl = typeof body.websiteUrl === "string" ? body.websiteUrl.trim() : "";
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
  if (fullName.length < 2 || fullName.length > 80) return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 });
  if (!/^[a-z0-9._]{3,24}$/.test(username)) return NextResponse.json({ error: "Username must be 3–24 letters, numbers, dots, or underscores." }, { status: 400 });
  if (bio.length > 300) return NextResponse.json({ error: "Bio must be 300 characters or fewer." }, { status: 400 });
  if (websiteUrl && (!/^https?:\/\//i.test(websiteUrl) || websiteUrl.length > 2048)) return NextResponse.json({ error: "Website must be a valid http or https URL." }, { status: 400 });
  const hostedAvatarPath = /^\/uploads\/avatars\/[0-9a-f-]{36}\.(?:jpg|png|webp|gif)$/i.test(avatarUrl);
  if (avatarUrl && ((!/^https?:\/\//i.test(avatarUrl) && !hostedAvatarPath) || avatarUrl.length > 2048)) return NextResponse.json({ error: "Profile photo must be a valid image URL or uploaded image." }, { status: 400 });
  try {
    const user = await db.orm.User.where({ id: session.userId }).update({ fullName, username, bio: bio || null, websiteUrl: websiteUrl || null, avatarUrl: avatarUrl || null });
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    return NextResponse.json({ user: { fullName: user.fullName, username: user.username, bio: user.bio, websiteUrl: user.websiteUrl, avatarUrl: user.avatarUrl } });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That username is already in use." }, { status: 409 });
    console.error("Profile update failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
