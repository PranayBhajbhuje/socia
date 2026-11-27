import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import { getMediaExtension, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, type UploadedMediaType } from "@/lib/media-upload";
import { transcodeVideoToWebm, VideoTranscodeError } from "@/lib/video-transcode";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let savedFilePath: string | null = null;
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Sign in to add a story." }, { status: 401 });

    let mediaUrl = "";
    let caption = "";
    let mediaFile: File | null = null;
    let mediaType: UploadedMediaType | null = null;
    let postId: string | null = null;

    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return NextResponse.json({ error: "Could not read the selected media file." }, { status: 400 });
      }

      const selectedFile = form.get("mediaFile");
      if (selectedFile !== null && !(selectedFile instanceof File)) {
        return NextResponse.json({ error: "Choose a valid image or video file." }, { status: 400 });
      }
      mediaFile = selectedFile instanceof File ? selectedFile : null;
      mediaUrl = typeof form.get("mediaUrl") === "string" ? String(form.get("mediaUrl")).trim() : "";
      caption = typeof form.get("caption") === "string" ? String(form.get("caption")).trim() : "";
      const requestedType = form.get("type");
      mediaType = requestedType === "image" || requestedType === "video" ? requestedType : null;
    } else {
      let body: { mediaUrl?: unknown; caption?: unknown; postId?: unknown };
      try {
        body = await request.json() as { mediaUrl?: unknown; caption?: unknown; postId?: unknown };
      } catch {
        return NextResponse.json({ error: "Invalid story." }, { status: 400 });
      }
      mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
      caption = typeof body.caption === "string" ? body.caption.trim() : "";
      if (body.postId !== undefined && typeof body.postId !== "string") {
        return NextResponse.json({ error: "Choose a valid post to add to your story." }, { status: 400 });
      }
      postId = typeof body.postId === "string" ? body.postId.trim() : null;
    }

    if (caption.length > 300) return NextResponse.json({ error: "Story caption must be 300 characters or fewer." }, { status: 400 });
    if (postId) {
      if (mediaFile || mediaUrl) return NextResponse.json({ error: "A shared post cannot include separate media." }, { status: 400 });
      const post = await db.orm.Post.where({ id: postId }).first();
      if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
      const now = new Date();
      const story = await db.orm.Story.create({
        userId: session.userId,
        postId: post.id,
        mediaUrl: null,
        caption: caption || null,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });
      return NextResponse.json({ story }, { status: 201 });
    }
    if (mediaFile && mediaUrl) return NextResponse.json({ error: "Choose a file or a media URL, not both." }, { status: 400 });
    if (!mediaFile && !/^https?:\/\//i.test(mediaUrl) && !mediaUrl.startsWith("/")) {
      return NextResponse.json({ error: "Choose an image or video file, or add an http, https, or local media URL." }, { status: 400 });
    }
    if (mediaUrl.length > 2048) return NextResponse.json({ error: "Story media URL is too long." }, { status: 400 });

    if (mediaFile) {
      if (!mediaType) return NextResponse.json({ error: "Choose whether this story is an image or video." }, { status: 400 });
      const maxBytes = mediaType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (mediaFile.size === 0 || mediaFile.size > maxBytes) {
        return NextResponse.json({
          error: mediaType === "image" ? "Images must be smaller than 10 MB." : "Videos must be smaller than 50 MB.",
        }, { status: 400 });
      }

      let bytes: Buffer<ArrayBufferLike> = Buffer.from(await mediaFile.arrayBuffer());
      let extension = getMediaExtension(bytes, mediaType);
      if (!extension) {
        return NextResponse.json({
          error: mediaType === "image"
            ? "Use a valid JPEG, PNG, WebP, or GIF image."
            : "Use a valid MP4 or WebM video.",
        }, { status: 400 });
      }

      if (mediaType === "video") {
        try {
          bytes = await transcodeVideoToWebm(bytes);
        } catch (error) {
          if (!(error instanceof VideoTranscodeError)) throw error;
          console.error("Uploaded story video conversion failed:", error.message);
          return NextResponse.json({ error: "Could not convert this video. Try another MP4 or WebM file." }, { status: 400 });
        }
        if (bytes.length > MAX_VIDEO_BYTES) {
          return NextResponse.json({ error: "The converted video is larger than 50 MB. Choose a shorter or smaller video." }, { status: 400 });
        }
        extension = "mp4";
      }

      const filename = `${randomUUID()}.${extension}`;
      const directory = path.join(process.cwd(), "public", "uploads", "stories");
      await mkdir(directory, { recursive: true });
      savedFilePath = path.join(directory, filename);
      await writeFile(savedFilePath, bytes, { flag: "wx" });
      mediaUrl = `/uploads/stories/${filename}`;
    }

    const now = new Date();
    const story = await db.orm.Story.create({
      userId: session.userId,
      mediaUrl,
      caption: caption || null,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    savedFilePath = null;
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch (cleanupError) {
        console.error("Story media cleanup failed:", cleanupError);
      }
    }
    console.error("POST /api/stories error:", error);
    return NextResponse.json({ error: "Could not add story." }, { status: 500 });
  }
}
