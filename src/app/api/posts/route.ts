import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

type PostType = "text" | "image" | "video";
interface CreatePostBody {
  type?: unknown;
  content?: unknown;
  mediaUrl?: unknown;
  musicTitle?: unknown;
}

const VALID_TYPES = new Set<PostType>(["text", "image", "video"]);
function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Sign in to create a post." }, { status: 401 });
    }

    let body: CreatePostBody;
    try {
      body = (await request.json()) as CreatePostBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const type = typeof body.type === "string" ? body.type.trim().toLowerCase() as PostType : "text";
    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid post type. Expected "text", "image", or "video".' }, { status: 400 });
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const mediaUrl = optionalString(body.mediaUrl);
    const musicTitle = optionalString(body.musicTitle);
    if (!content && !mediaUrl) {
      return NextResponse.json({ error: "Please provide post content or a media URL." }, { status: 400 });
    }
    if (mediaUrl && !/^https?:\/\//i.test(mediaUrl) && !mediaUrl.startsWith("/")) {
      return NextResponse.json({ error: "Media URL must start with http://, https://, or /." }, { status: 400 });
    }

    const post = await db.orm.Post.create({
      authorId: session.userId,
      type,
      content: content || null,
      mediaUrl,
      musicTitle,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
