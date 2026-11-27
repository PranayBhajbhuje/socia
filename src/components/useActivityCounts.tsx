"use client";

import { useCallback, useEffect, useState } from "react";

type ActivityCounts = { notifications: number; messages: number };

export function useActivityCounts() {
  const [counts, setCounts] = useState<ActivityCounts>({ notifications: 0, messages: 0 });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/activity-counts", { cache: "no-store" });
      if (!response.ok) throw new Error(`Activity count request failed (${response.status}).`);
      const result = await response.json() as Partial<ActivityCounts>;
      if (typeof result.notifications !== "number" || typeof result.messages !== "number") {
        throw new Error("Activity count response was invalid.");
      }
      setCounts({ notifications: result.notifications, messages: result.messages });
    } catch (error) {
      console.error("Could not refresh activity counts:", error);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return counts;
}

export function ActivityBadge({ count, label }: { count: number; label: string }) {
  if (count < 1) return null;
  const display = count > 99 ? "99+" : String(count);
  return <span aria-label={`${count} ${label}`} className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-neutral-950">{display}</span>;
}
