"use client";

import { useState } from "react";

export default function UserAvatar({ src, name, sizeClass = "h-10 w-10", textClass = "text-sm", className = "" }: { src: string | null; name: string; sizeClass?: string; textClass?: string; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name.trim().slice(0, 1).toUpperCase() || "?";
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${sizeClass} ${textClass} ${className}`}>
    {src && !imageFailed ? <img src={src} alt={`${name}'s profile picture`} onError={() => setImageFailed(true)} className="h-full w-full object-cover" /> : initials}
  </span>;
}
