"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

const inputClass = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800";

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) window.history.replaceState(null, "", "/reset-password");
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not reset your password.");
      setMessage(result.message ?? "Password updated. Sign in with your new password.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
    <section className="flex min-h-screen w-full max-w-md flex-col bg-white px-6 py-10 dark:bg-neutral-950 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Choose a new password</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Use at least 10 characters. Reset links expire after 5 minutes.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label htmlFor="new-password" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">New password
          <input id="new-password" name="password" required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(error)} className={inputClass} />
        </label>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">Confirm new password
          <input id="confirm-password" name="confirmPassword" required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={Boolean(error)} className={inputClass} />
        </label>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">{message} <Link href="/login" className="font-semibold underline">Sign in</Link></p>}
        {!token && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">This reset link is missing or invalid. Request a new one.</p>}
        <button type="submit" disabled={submitting || !token || Boolean(message)} aria-busy={submitting} className="w-full rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">{submitting ? "Updating…" : "Update password"}</button>
      </form>
      <p className="mt-7 border-t border-zinc-200 pt-5 text-center text-sm dark:border-zinc-800"><Link href="/login" className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Back to sign in</Link></p>
    </section>
  </main>;
}

export default function ResetPasswordForm() {
  return <Suspense fallback={<main className="min-h-screen bg-zinc-50 dark:bg-black" />}><ResetPasswordFormContent /></Suspense>;
}
