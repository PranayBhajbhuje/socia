import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import { transcodeVideoToWebm, VideoTranscodeError } from "@/lib/video-transcode";
import { getMediaExtension, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/media-upload";

export const runtime = "nodejs";

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
  let savedFilePath: string | null = null;
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Sign in to create a post." }, { status: 401 });
    }

    let body: CreatePostBody;
    let mediaFile: File | null = null;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return NextResponse.json({ error: "Could not read the selected media file." }, { status: 400 });
      }
      body = {
        type: form.get("type"),
        content: form.get("content"),
        mediaUrl: form.get("mediaUrl"),
        musicTitle: form.get("musicTitle"),
      };
      const selectedFile = form.get("mediaFile");
      if (selectedFile !== null && !(selectedFile instanceof File)) {
        return NextResponse.json({ error: "Choose a valid image or video file." }, { status: 400 });
      }
      mediaFile = selectedFile instanceof File ? selectedFile : null;
    } else {
      try {
        body = (await request.json()) as CreatePostBody;
      } catch {
        return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
      }
    }

    const type = typeof body.type === "string" ? body.type.trim().toLowerCase() as PostType : "text";
    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid post type. Expected "text", "image", or "video".' }, { status: 400 });
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    let mediaUrl = optionalString(body.mediaUrl);
    const musicTitle = optionalString(body.musicTitle);
    if (mediaFile && type === "text") {
      return NextResponse.json({ error: "Choose Image or Video as the post type to upload a file." }, { status: 400 });
    }
    if (mediaFile && mediaUrl) {
      return NextResponse.json({ error: "Choose either a file or a media URL, not both." }, { status: 400 });
    }
    if (!content && !mediaUrl && !mediaFile) {
      return NextResponse.json({ error: "Please provide post content or media." }, { status: 400 });
    }
    if (mediaUrl && !/^https?:\/\//i.test(mediaUrl) && !mediaUrl.startsWith("/")) {
      return NextResponse.json({ error: "Media URL must start with http://, https://, or /." }, { status: 400 });
    }

    if (mediaFile) {
      const maxBytes = type === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (mediaFile.size === 0 || mediaFile.size > maxBytes) {
        return NextResponse.json({
          error: type === "image" ? "Images must be smaller than 10 MB." : "Videos must be smaller than 50 MB.",
        }, { status: 400 });
      }

      let bytes: Buffer<ArrayBufferLike> = Buffer.from(await mediaFile.arrayBuffer());
      let extension = type === "text" ? null : getMediaExtension(bytes, type);
      if (!extension) {
        return NextResponse.json({
          error: type === "image"
            ? "Use a valid JPEG, PNG, WebP, or GIF image."
            : "Use a valid MP4 or WebM video.",
        }, { status: 400 });
      }

      if (type === "video") {
        try {
          bytes = await transcodeVideoToWebm(bytes);
        } catch (error) {
          if (!(error instanceof VideoTranscodeError)) throw error;
          console.error("Uploaded video conversion failed:", error.message);
          return NextResponse.json({ error: "Could not convert this video. Try another MP4 or WebM file." }, { status: 400 });
        }
        if (bytes.length > MAX_VIDEO_BYTES) {
          return NextResponse.json({ error: "The converted video is larger than 50 MB. Choose a shorter or smaller video." }, { status: 400 });
        }
        extension = "mp4";
      }

      const filename = `${randomUUID()}.${extension}`;
      const directory = path.join(process.cwd(), "public", "uploads", "posts");
      await mkdir(directory, { recursive: true });
      const filePath = path.join(directory, filename);
      await writeFile(filePath, bytes, { flag: "wx" });
      savedFilePath = filePath;
      mediaUrl = `/uploads/posts/${filename}`;
    }

    const post = await db.orm.Post.create({
      authorId: session.userId,
      type,
      content: content || null,
      mediaUrl,
      musicTitle,
    });
    savedFilePath = null;
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch (cleanupError) {
        console.error("Post media cleanup failed:", cleanupError);
      }
    }
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
