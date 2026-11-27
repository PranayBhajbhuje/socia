import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to add a story." }, { status: 401 });
  let body: { mediaUrl?: unknown; caption?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid story." }, { status: 400 }); }
  const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  if (!/^https?:\/\//i.test(mediaUrl) && !mediaUrl.startsWith("/")) return NextResponse.json({ error: "Add an http, https, or local media URL." }, { status: 400 });
  if (mediaUrl.length > 2048 || caption.length > 300) return NextResponse.json({ error: "Story media or caption is too long." }, { status: 400 });
  const now = new Date();
  const story = await db.orm.Story.create({ userId: session.userId, mediaUrl, caption: caption || null, createdAt: now, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) });
  return NextResponse.json({ story }, { status: 201 });
}
