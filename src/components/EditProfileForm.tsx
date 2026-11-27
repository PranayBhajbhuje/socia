"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

type Profile = { fullName: string; username: string; bio: string | null; websiteUrl: string | null; avatarUrl: string | null };
const inputClass = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950";
const fieldClass = "block text-lg font-normal text-zinc-800 dark:text-zinc-200";
const profileInputClass = "mt-2.5 h-[58px] w-full rounded-2xl border border-zinc-200 bg-white px-4 text-lg text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800";

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

  return <form onSubmit={submit} className="flex min-h-[calc(100dvh-4.5rem)] flex-col">
    <div className="flex-1 space-y-7 px-6 pb-8 pt-5">
      <div className="flex justify-center pb-1 pt-1">
        <label htmlFor="profile-avatar-file" className="group relative cursor-pointer rounded-full focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-4 dark:focus-within:ring-offset-neutral-950" aria-label="Change profile picture">
          <UserAvatar src={avatarPreview} name={form.fullName} sizeClass="h-32 w-32" textClass="text-4xl" />
          <span aria-hidden="true" className="absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white text-zinc-900 shadow-sm transition group-hover:bg-zinc-100 dark:border-neutral-950 dark:bg-zinc-800 dark:text-zinc-100 dark:group-hover:bg-zinc-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z" /></svg>
          </span>
          <input id="profile-avatar-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseAvatar} className="sr-only" />
        </label>
      </div>

      <label className={fieldClass}>Name<input required minLength={2} maxLength={80} autoComplete="name" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} className={profileInputClass} /></label>

      <label className={fieldClass}>Username
        <span className="relative mt-2.5 block">
          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-800 dark:text-zinc-200">@</span>
          <input required minLength={3} maxLength={24} autoComplete="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} className={`${profileInputClass} mt-0 pl-9`} />
        </span>
      </label>

      <label className={fieldClass}>Bio<textarea maxLength={300} rows={5} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className="mt-2.5 min-h-52 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-lg leading-relaxed text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800" /></label>

      <div>
        <p className={fieldClass}>Link</p>
        <div className="mt-3 flex min-h-16 items-center gap-3">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
          </span>
          <span className="shrink-0 text-lg font-medium text-zinc-900 dark:text-zinc-100">Website</span>
          <label htmlFor="profile-website" className="sr-only">Website URL</label>
          <input id="profile-website" type="url" value={form.websiteUrl} placeholder="https://…" onChange={(event) => updateField("websiteUrl", event.target.value)} className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-2 text-base text-zinc-900 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-100" />
        </div>
      </div>

      <details className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-200">Use a profile photo URL instead</summary>
        <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-200">Photo URL
          <input type="url" value={form.avatarUrl} placeholder="https://example.com/photo.jpg" onChange={(event) => { setAvatarFile(null); setAvatarPreview(event.target.value || null); setForm((current) => ({ ...current, avatarUrl: event.target.value })); }} className={inputClass} />
        </label>
      </details>

      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">Profile photos: JPEG, PNG, WebP, or GIF up to 5 MB.</p>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
    </div>

    <div className="sticky bottom-0 border-t border-zinc-100 bg-white/95 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-zinc-800 dark:bg-neutral-950/95">
      <button disabled={saving} className="w-full rounded-full bg-zinc-900 py-3.5 text-base font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">{saving ? "Saving…" : "Save changes"}</button>
    </div>
  </form>;
}
