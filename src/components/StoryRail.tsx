"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import VideoMedia, { getYouTubeEmbedUrl } from "@/components/VideoMedia";
import UserAvatar from "@/components/UserAvatar";

type StoryItem = { id: string; userId: string; mediaUrl: string; caption: string | null; expiresAt: string; user: { fullName: string; username: string; avatarUrl: string | null }; viewed: boolean };
export default function StoryRail({ stories, currentUserId }: { stories: StoryItem[]; currentUserId: string }) {
  const [selected, setSelected] = useState<StoryItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingStory, setDeletingStory] = useState(false);
  const [storyError, setStoryError] = useState("");
  const router = useRouter();
  async function openStory(story: StoryItem) {
    setStoryError("");
    setSelected(story);
    if (!story.viewed && story.userId !== currentUserId) {
      try { await fetch(`/api/stories/${encodeURIComponent(story.id)}/view`, { method: "POST" }); } catch { /* viewing still works offline */ }
    }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaUrl, caption }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not add story.");
      setAdding(false); setMediaUrl(""); setCaption(""); router.refresh();
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
      setSelected(null); router.refresh();
    } catch (cause) { setStoryError(cause instanceof Error ? cause.message : "Could not delete story."); }
    finally { setDeletingStory(false); }
  }
  return <>
    <section aria-label="Stories" className="flex gap-4 overflow-x-auto border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
      <button type="button" onClick={() => setAdding(true)} aria-label="Add a story" className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-zinc-400 text-2xl text-zinc-700 dark:text-zinc-200">+</span><span className="max-w-16 truncate text-[11px] text-zinc-600 dark:text-zinc-300">Add Story</span></button>
      {stories.map((story) => <button key={story.id} type="button" onClick={() => void openStory(story)} aria-label={`${story.user.fullName}'s story${story.viewed ? ", viewed" : ", not viewed"}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className={`flex h-14 w-14 items-center justify-center rounded-full p-0.5 ${story.viewed ? "bg-zinc-300" : "bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600"}`}><span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-200 text-lg font-bold text-zinc-700"><UserAvatar src={story.user.avatarUrl} name={story.user.fullName} sizeClass="h-full w-full" className="border-2 border-white" /></span></span><span className="max-w-16 truncate text-[11px] text-zinc-700 dark:text-zinc-300">{story.userId === currentUserId ? "Your story" : story.user.username}</span></button>)}
    </section>
    {adding && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 text-zinc-900"><div className="flex justify-between"><h2 className="font-bold">Add a story</h2><button type="button" onClick={() => setAdding(false)} aria-label="Close">×</button></div><p className="mt-2 text-xs text-zinc-500">Stories expire after 24 hours. Paste an image or video URL.</p><form onSubmit={create} className="mt-4 space-y-3"><input required type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Media URL" className="w-full rounded-lg border border-zinc-300 p-3 text-sm" /><input maxLength={300} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className="w-full rounded-lg border border-zinc-300 p-3 text-sm" />{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={saving} className="w-full rounded-lg bg-zinc-900 p-3 font-semibold text-white">{saving ? "Sharing…" : "Share story"}</button></form></section></div>}
    {selected && <div role="dialog" aria-modal="true" aria-label={`Story by ${selected.user.fullName}`} onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">{selected.userId === currentUserId && <button type="button" onClick={() => void deleteStory()} disabled={deletingStory} className="absolute left-5 top-5 z-10 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{deletingStory ? "Deleting…" : "Delete story"}</button>}<button type="button" onClick={() => setSelected(null)} aria-label="Close story" className="absolute right-5 top-5 z-10 text-3xl text-white">×</button>{getYouTubeEmbedUrl(selected.mediaUrl) || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(selected.mediaUrl) ? <div className="w-full max-w-3xl" onClick={(event) => event.stopPropagation()}><VideoMedia src={selected.mediaUrl} title={`Story by ${selected.user.fullName}`} autoPlay className="aspect-video max-h-[85dvh] w-full rounded-xl bg-black" /></div> : <img src={selected.mediaUrl} alt={selected.caption ?? `Story by ${selected.user.fullName}`} className="max-h-[85dvh] max-w-full rounded-xl object-contain" />}{storyError && <p role="alert" className="absolute top-16 left-5 right-5 rounded-lg bg-black/80 p-3 text-center text-sm text-red-200">{storyError}</p>}<div className="pointer-events-none absolute bottom-8 left-6 right-6 text-center text-white"><p className="font-semibold">{selected.user.fullName}</p>{selected.caption && <p className="mt-1 text-sm">{selected.caption}</p>}</div></div>}
  </>;
}
