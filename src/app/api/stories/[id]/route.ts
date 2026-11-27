import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to delete a story." }, { status: 401 });
  const { id } = await params;
  const story = await db.orm.Story.where({ id }).first();
  if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });
  if (story.userId !== session.userId) return NextResponse.json({ error: "You can only delete your own stories." }, { status: 403 });
  await db.orm.Story.where({ id }).delete();
  return NextResponse.json({ deleted: true });
}
