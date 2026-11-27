"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FollowButton from "@/components/FollowButton";
import StartConversationButton from "@/components/StartConversationButton";
import UserAvatar from "@/components/UserAvatar";

type Person = { id: string; fullName: string; username: string; bio: string | null; avatarUrl: string | null };

export default function FollowListClient({ people, profileId, currentUserId, initiallyFollowed, type, canRemove }: { people: Person[]; profileId: string; currentUserId: string; initiallyFollowed: string[]; type: "following" | "followers"; canRemove: boolean }) {
  const [query, setQuery] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const visible = people.filter((person) => !removed.includes(person.id) && `${person.fullName} ${person.username}`.toLowerCase().includes(query.trim().toLowerCase()));

  async function remove(person: Person) {
    if (removing || !window.confirm(`Remove @${person.username} from your followers?`)) return;
    setRemoving(person.id);
    setError("");
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(profileId)}/followers/${encodeURIComponent(person.id)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not remove follower.");
      setRemoved((list) => [...list, person.id]);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove follower.");
    } finally {
      setRemoving(null);
    }
  }

  return <div className="px-5">
    <label className="block py-3">
      <span className="sr-only">Search {type}</span>
      <span className="relative block">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${type}…`} className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:ring-blue-950" />
      </span>
    </label>
    {error && <p role="alert" className="py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    {visible.length === 0 ? (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">{query ? "No matching accounts." : `No ${type} yet.`}</p>
    ) : visible.map((person) => (
      <article key={person.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 py-3.5 dark:border-zinc-800">
        <Link href={`/profile/${encodeURIComponent(person.username)}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <UserAvatar src={person.avatarUrl} name={person.fullName} sizeClass="h-11 w-11" />
          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{person.fullName}</span><span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">@{person.username}</span>{person.bio && <span className="mt-1 block line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{person.bio}</span>}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {person.id !== currentUserId && <StartConversationButton userId={person.id} />}
          {canRemove && <button type="button" onClick={() => void remove(person)} disabled={removing !== null} className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">{removing === person.id ? "Removing…" : "Remove"}</button>}
          {!canRemove && person.id !== currentUserId && type === "following" && <FollowButton userId={person.id} initialFollowing={initiallyFollowed.includes(person.id)} />}
        </div>
      </article>
    ))}
  </div>;
}
