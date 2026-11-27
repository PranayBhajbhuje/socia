"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import VideoMedia, { getYouTubeEmbedUrl } from "@/components/VideoMedia";
import UserAvatar from "@/components/UserAvatar";
import { groupStoriesByUser, type StoryGroup } from "@/lib/stories";

type StoryPost = { id: string; type: string; content: string | null; mediaUrl: string | null; musicTitle: string | null; author: { fullName: string; username: string; avatarUrl: string | null } };
type StoryItem = { id: string; userId: string; mediaUrl: string | null; caption: string | null; expiresAt: string; user: { fullName: string; username: string; avatarUrl: string | null }; viewed: boolean; post: StoryPost | null };
export default function StoryRail({ stories, currentUserId }: { stories: StoryItem[]; currentUserId: string }) {
  const [selectedStories, setSelectedStories] = useState<StoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewedStoryIds, setViewedStoryIds] = useState(() => new Set(stories.filter((story) => story.viewed).map((story) => story.id)));
  const [adding, setAdding] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const mediaPreviewRef = useRef<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingStory, setDeletingStory] = useState(false);
  const [storyError, setStoryError] = useState("");
  const router = useRouter();
  const selected = selectedStories[selectedIndex] ?? null;
  const storyGroups = groupStoriesByUser(stories, currentUserId);

  useEffect(() => {
    return () => {
      if (mediaPreviewRef.current) URL.revokeObjectURL(mediaPreviewRef.current);
    };
  }, []);

  function setMediaPreviewForFile(file: File | null) {
    if (mediaPreviewRef.current) URL.revokeObjectURL(mediaPreviewRef.current);
    mediaPreviewRef.current = file ? URL.createObjectURL(file) : null;
    setMediaPreview(mediaPreviewRef.current);
  }

  function chooseStoryFile(file: File | null) {
    if (!file) return;
    const detectedType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : mediaType;
    if (file.type && detectedType !== mediaType) {
      setError(`Choose a ${mediaType} file or switch the media type.`);
      setMediaFile(null);
      setMediaPreviewForFile(null);
      return;
    }
    const maxBytes = detectedType === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size === 0) {
      setError("Selected file is empty.");
      setMediaFile(null);
      setMediaPreviewForFile(null);
      return;
    }
    if (file.size > maxBytes) {
      setError(detectedType === "image" ? "Images must be smaller than 10 MB." : "Videos must be smaller than 50 MB.");
      setMediaFile(null);
      setMediaPreviewForFile(null);
      return;
    }
    setError("");
    setMediaUrl("");
    setMediaFile(file);
    setMediaPreviewForFile(file);
  }

  async function markStoryViewed(story: StoryItem) {
    if (story.viewed || viewedStoryIds.has(story.id) || story.userId === currentUserId) return;
    setViewedStoryIds((current) => new Set(current).add(story.id));
    setStoryError("");
    try {
      const response = await fetch(`/api/stories/${encodeURIComponent(story.id)}/view`, { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not mark story as viewed.");
    } catch (cause) {
      setViewedStoryIds((current) => {
        const next = new Set(current);
        next.delete(story.id);
        return next;
      });
      setStoryError(cause instanceof Error ? cause.message : "Could not mark story as viewed.");
    }
  }
  function openStoryGroup(group: StoryGroup<StoryItem>) {
    const firstUnviewed = group.stories.findIndex((story) => !story.viewed && !viewedStoryIds.has(story.id));
    const index = firstUnviewed < 0 ? 0 : firstUnviewed;
    setStoryError("");
    setSelectedStories(group.stories);
    setSelectedIndex(index);
    void markStoryViewed(group.stories[index]);
  }
  function moveStory(index: number) {
    if (index >= selectedStories.length) {
      setSelectedStories([]);
      return;
    }
    if (index < 0) return;
    setSelectedIndex(index);
    void markStoryViewed(selectedStories[index]);
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mediaFile && !mediaUrl.trim()) {
      setError("Choose a photo or video from your device, use your camera, or paste a media URL.");
      return;
    }
    setSaving(true); setError("");
    try {
      let response: Response;
      if (mediaFile) {
        const form = new FormData();
        form.set("type", mediaType);
        form.set("caption", caption);
        form.set("mediaFile", mediaFile);
        response = await fetch("/api/stories", { method: "POST", body: form });
      } else {
        response = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaUrl, caption }) });
      }
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not add story.");
      setAdding(false); setMediaUrl(""); setMediaFile(null); setMediaPreviewForFile(null); setCaption(""); setMediaType("image"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add story."); }
    finally { setSaving(false); }
  }
  async function deleteStory() {
    if (!selected || deletingStory || !window.confirm("Delete this story? This cannot be undone.")) return;
    setDeletingStory(true); setStoryError("");
    try {
      const response = await fetch(`/api/stories/${encodeURIComponent(selected.id)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not delete story.");
      setSelectedStories([]); router.refresh();
    } catch (cause) { setStoryError(cause instanceof Error ? cause.message : "Could not delete story."); }
    finally { setDeletingStory(false); }
  }
  return <>
    <section aria-label="Stories" className="flex gap-4 overflow-x-auto border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
      <button type="button" onClick={() => setAdding(true)} aria-label="Add a story" className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-zinc-400 text-2xl text-zinc-700 dark:text-zinc-200">+</span><span className="max-w-16 truncate text-[11px] text-zinc-600 dark:text-zinc-300">Add Story</span></button>
      {storyGroups.map((group) => {
        const hasUnviewed = group.stories.some((story) => !story.viewed && !viewedStoryIds.has(story.id));
        return <button key={group.userId} type="button" onClick={() => openStoryGroup(group)} aria-label={`${group.user.fullName}'s ${group.stories.length} ${group.stories.length === 1 ? "story" : "stories"}${hasUnviewed ? ", not viewed" : ", viewed"}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <span className={`relative flex h-14 w-14 items-center justify-center rounded-full p-0.5 ${hasUnviewed ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600" : "bg-zinc-300"}`}>
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-200 text-lg font-bold text-zinc-700">
              <UserAvatar src={group.user.avatarUrl} name={group.user.fullName} sizeClass="h-full w-full" className="border-2 border-white" />
            </span>
          </span>
          <span className="max-w-16 truncate text-[11px] text-zinc-700 dark:text-zinc-300">{group.userId === currentUserId ? "Your story" : group.user.username}</span>
        </button>;
      })}
    </section>
    {adding && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setAdding(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-story-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl dark:bg-zinc-950 dark:text-zinc-100">
        <div className="flex items-center justify-between">
          <div><h2 id="add-story-title" className="text-lg font-bold">Add a story</h2><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Stories disappear after 24 hours.</p></div>
          <button type="button" onClick={() => setAdding(false)} disabled={saving} aria-label="Close" className="rounded-full px-3 py-1 text-xl text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800">×</button>
        </div>
        <form onSubmit={create} className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Media type
            <select value={mediaType} onChange={(event) => { setMediaType(event.target.value as "image" | "video"); setMediaFile(null); setMediaPreviewForFile(null); setError(""); }} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <option value="image">Photo</option><option value="video">Video</option>
            </select>
          </label>
          <div>
            <p className="mb-2 text-sm font-medium">Choose a {mediaType}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-3 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-blue-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">
                Choose from device
                <input type="file" accept={mediaType === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm"} disabled={Boolean(mediaUrl.trim()) || saving} onChange={(event) => { chooseStoryFile(event.currentTarget.files?.[0] ?? null); event.currentTarget.value = ""; }} className="sr-only" />
              </label>
              <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-3 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-blue-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">
                Use camera
                <input type="file" accept={mediaType === "image" ? "image/*" : "video/*"} capture="environment" disabled={Boolean(mediaUrl.trim()) || saving} onChange={(event) => { chooseStoryFile(event.currentTarget.files?.[0] ?? null); event.currentTarget.value = ""; }} className="sr-only" />
              </label>
            </div>
          </div>
          {mediaFile && <div className="space-y-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
            {mediaPreview && <div className="relative mx-auto h-64 aspect-[9/16] overflow-hidden rounded-lg bg-black">
              {mediaType === "image" ? <img src={mediaPreview} alt="Selected story preview" className="h-full w-full object-contain" /> : <VideoMedia src={mediaPreview} title="Selected story video preview" className="h-full w-full bg-black object-contain" />}
              {caption && <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 text-center text-xs text-white">{caption}</p>}
            </div>}
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs text-zinc-500">{mediaFile.name} · {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              <button type="button" onClick={() => { setMediaFile(null); setMediaPreviewForFile(null); }} className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">Remove</button>
            </div>
          </div>}
          <label className="block text-sm font-medium">Or paste a media URL
            <input type="url" value={mediaUrl} onChange={(event) => { setMediaUrl(event.target.value); setError(""); }} disabled={Boolean(mediaFile) || saving} placeholder="https://…" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
          </label>
          <label className="block text-sm font-medium">Caption (optional)
            <input maxLength={300} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Add a caption…" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Photos up to 10 MB, videos up to 50 MB. Camera access depends on your browser and device permissions.</p>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button disabled={saving} className="w-full rounded-lg bg-zinc-900 p-3 font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">{saving ? mediaFile ? "Uploading…" : "Sharing…" : "Share story"}</button>
        </form>
      </section>
    </div>}
    {selected && <div role="dialog" aria-modal="true" aria-label={`${selectedStories.length} stories by ${selected.user.fullName}`} onClick={(event) => { if (event.target === event.currentTarget) setSelectedStories([]); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3">
      <section style={{ height: "min(84dvh, 740px)", width: "min(47.25dvh, 416.25px, calc(100vw - 1.5rem))" }} className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white shadow-2xl">
        {selectedStories.length > 1 && selectedIndex > 0 && <button type="button" onClick={() => moveStory(selectedIndex - 1)} aria-label="Previous story" className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white hover:bg-black/70">‹</button>}
        {selectedStories.length > 1 && <button type="button" onClick={() => moveStory(selectedIndex + 1)} aria-label={selectedIndex === selectedStories.length - 1 ? "Close stories" : "Next story"} className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white hover:bg-black/70">›</button>}
        <div className="absolute inset-0">
          {selected.post ? selected.post.type === "text" ? (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-indigo-700 via-fuchsia-700 to-rose-600 p-7 text-center">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Shared post</p>
              <p className="max-h-[60%] overflow-y-auto whitespace-pre-wrap break-words text-xl font-bold leading-relaxed">{selected.post.content}</p>
              <p className="mt-6 text-sm text-white/80">{selected.post.author.fullName} · @{selected.post.author.username}</p>
              <a href={`/#post-${encodeURIComponent(selected.post.id)}`} className="pointer-events-auto mt-6 rounded-full bg-black/30 px-4 py-2 text-sm font-semibold hover:bg-black/50">View post</a>
            </div>
          ) : selected.post.mediaUrl ? (
            <>
              {selected.post.type === "video" ? <VideoMedia src={selected.post.mediaUrl} title={`Shared video by ${selected.post.author.fullName}`} autoPlay className="h-full w-full bg-black object-contain" /> : <img src={selected.post.mediaUrl} alt={selected.post.content ?? `Shared image by ${selected.post.author.fullName}`} className="h-full w-full bg-black object-contain" />}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-6 pt-16">
                <p className="text-sm font-bold">{selected.post.author.fullName} <span className="font-normal text-white/70">@{selected.post.author.username}</span></p>
                {selected.post.content && <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-sm">{selected.post.content}</p>}
                {selected.post.musicTitle && <p className="mt-1 text-xs text-white/75">♪ {selected.post.musicTitle}</p>}
                <a href={selected.post.type === "video" ? `/video/${encodeURIComponent(selected.post.id)}` : `/#post-${encodeURIComponent(selected.post.id)}`} className="pointer-events-auto mt-3 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-semibold hover:bg-white/30">View post</a>
              </div>
            </>
          ) : <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/80">This shared post is unavailable.</div> : selected.mediaUrl && (getYouTubeEmbedUrl(selected.mediaUrl) || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(selected.mediaUrl)) ? (
            <VideoMedia src={selected.mediaUrl} title={`Story by ${selected.user.fullName}`} autoPlay className="h-full w-full bg-black object-contain" />
          ) : selected.mediaUrl ? (
            <img src={selected.mediaUrl} alt={selected.caption ?? `Story by ${selected.user.fullName}`} className="h-full w-full bg-black object-contain" />
          ) : <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/80">This story has no media.</div>}
          {!selected.post && selected.caption && <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-6 pt-16 text-center text-sm">{selected.caption}</div>}
        </div>
        <div className="absolute inset-x-0 top-0 z-10 p-4">
          <div role="group" aria-label={`Story ${selectedIndex + 1} of ${selectedStories.length}`} className="mb-3 flex gap-1">
            {selectedStories.map((story, index) => <span key={story.id} aria-current={index === selectedIndex ? "step" : undefined} className={`h-1 flex-1 rounded-full ${index <= selectedIndex || story.viewed || viewedStoryIds.has(story.id) ? "bg-white" : "bg-white/35"}`} />)}
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar src={selected.user.avatarUrl} name={selected.user.fullName} sizeClass="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{selected.user.username}</p>
              <p className="text-[11px] text-white/70">{selected.post ? "Shared post" : selected.userId === currentUserId ? "Your status" : "Story"}{selectedStories.length > 1 ? ` · ${selectedIndex + 1}/${selectedStories.length}` : ""}</p>
            </div>
            {selected.userId === currentUserId && <button type="button" onClick={() => void deleteStory()} disabled={deletingStory} className="rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold hover:bg-red-700 disabled:opacity-60">{deletingStory ? "Deleting…" : "Delete"}</button>}
            <button type="button" onClick={() => setSelectedStories([])} aria-label="Close story" className="rounded-full bg-black/40 px-2.5 py-1 text-2xl leading-none text-white hover:bg-black/60">×</button>
          </div>
        </div>
        {storyError && <p role="alert" className="absolute inset-x-4 top-24 z-20 rounded-lg bg-black/80 p-3 text-center text-sm text-red-200">{storyError}</p>}
      </section>
    </div>}
  </>;
}
