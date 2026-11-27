"use client";

import { useState } from "react";

function getYouTubeVideoId(source: string): string | null {
  try {
    const url = new URL(source);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      videoId = url.searchParams.get("v");
      if (!videoId) videoId = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})(?:\/|$)/)?.[1] ?? null;
    }

    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
    return videoId;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(source: string, autoPlay = false): string | null {
  const videoId = getYouTubeVideoId(source);
  if (!videoId) return null;

  try {
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    embed.searchParams.set("playsinline", "1");
    embed.searchParams.set("rel", "0");
    if (autoPlay) {
      embed.searchParams.set("autoplay", "1");
      embed.searchParams.set("mute", "1");
    }
    return embed.toString();
  } catch {
    return null;
  }
}

export function getYouTubeWatchUrl(source: string): string | null {
  const videoId = getYouTubeVideoId(source);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

export default function VideoMedia({ src, title, className, autoPlay = false }: { src: string; title: string; className: string; autoPlay?: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const embedUrl = getYouTubeEmbedUrl(src, autoPlay);

  if (embedUrl) {
    const watchUrl = getYouTubeWatchUrl(src);
    return <>
      <iframe
        src={embedUrl}
        title={title}
        className={className}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      {watchUrl && <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Embed unavailable?{" "}
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          Open on YouTube
        </a>
      </p>}
    </>;
  }

  return <>
    <video src={src} controls playsInline preload="metadata" autoPlay={autoPlay} muted={autoPlay} aria-label={title} onError={() => setFailedSource(src)} className={className} />
    {failedSource === src && <p role="status" className="p-3 text-center text-xs text-white/80">This video could not be played. Use a publicly accessible direct MP4 (H.264) or WebM (VP8/VP9) file URL.</p>}
  </>;
}
