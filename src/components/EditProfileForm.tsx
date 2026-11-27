"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

type Profile = { fullName: string; username: string; bio: string | null; websiteUrl: string | null; avatarUrl: string | null };
const inputClass = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950";
const labelClass = "block text-sm font-medium text-zinc-800 dark:text-zinc-200";

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: profile.fullName, username: profile.username, bio: profile.bio ?? "", websiteUrl: profile.websiteUrl ?? "", avatarUrl: profile.avatarUrl ?? "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);

  useEffect(() => () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setForm((current) => ({ ...current, avatarUrl: "" }));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        const upload = new FormData();
        upload.set("avatar", avatarFile);
        const uploadResponse = await fetch("/api/profile/avatar", { method: "POST", body: upload });
        const uploadResult = await uploadResponse.json() as { avatarUrl?: string; error?: string };
        if (!uploadResponse.ok || !uploadResult.avatarUrl) throw new Error(uploadResult.error ?? "Could not upload profile picture.");
        avatarUrl = uploadResult.avatarUrl;
      }

      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, avatarUrl }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save profile.");
      router.push(`/profile/${encodeURIComponent(form.username)}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const updateField = (key: "fullName" | "username" | "websiteUrl", value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <form onSubmit={submit} className="space-y-5 p-5">
    <div className="flex justify-center pb-1">
      <label className="group relative cursor-pointer rounded-full focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-4 dark:focus-within:ring-offset-neutral-950" aria-label="Choose profile picture">
        <UserAvatar src={avatarPreview} name={form.fullName} sizeClass="h-24 w-24" textClass="text-3xl" />
        <span aria-hidden="true" className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-zinc-700 shadow-sm transition group-hover:bg-zinc-100 dark:border-neutral-950 dark:bg-zinc-800 dark:text-zinc-100 dark:group-hover:bg-zinc-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z" /></svg>
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseAvatar} className="sr-only" />
      </label>
    </div>
    <label className={labelClass}>Name<input required minLength={2} maxLength={80} autoComplete="name" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} className={inputClass} /></label>
    <label className={labelClass}>Username<div className="relative"><span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">@</span><input required minLength={2} maxLength={24} autoComplete="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} className={`${inputClass} pl-8`} /></div></label>
    <label className={labelClass}>Bio<textarea maxLength={300} rows={4} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className={`${inputClass} resize-y`} /></label>
    <label className={labelClass}>Website<input type="url" value={form.websiteUrl} placeholder="https://example.com" onChange={(event) => updateField("websiteUrl", event.target.value)} className={inputClass} /></label>
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose a profile photo or use an image URL. JPEG, PNG, WebP, or GIF; maximum 5 MB.</p>
      <label className="inline-flex cursor-pointer items-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-blue-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">Choose image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseAvatar} className="sr-only" /></label>
      <label className={`${labelClass} pt-1`}>Or enter an image URL<input type="url" value={form.avatarUrl} placeholder="https://example.com/photo.jpg" onChange={(event) => { setAvatarFile(null); setAvatarPreview(event.target.value || null); setForm((current) => ({ ...current, avatarUrl: event.target.value })); }} className={inputClass} /></label>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
    <button disabled={saving} className="w-full rounded-full bg-zinc-900 py-3 font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">{saving ? "Saving…" : "Save changes"}</button>
  </form>;
}
