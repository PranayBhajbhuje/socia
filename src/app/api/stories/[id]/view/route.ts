import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to view stories." }, { status: 401 });
  const { id } = await params;
  const story = await db.orm.Story.where({ id }).first();
  if (!story || story.expiresAt.getTime() <= Date.now()) return NextResponse.json({ error: "Story not found or expired." }, { status: 404 });
  if (story.userId !== session.userId) {
    const existing = await db.orm.StoryView.where({ storyId: id, userId: session.userId }).first();
    if (!existing) await db.orm.StoryView.create({ storyId: id, userId: session.userId });
  }
  return NextResponse.json({ viewed: true });
}
