"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

function ResetPasswordForm() {
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
    event.preventDefault(); setError(""); setMessage("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not reset password.");
      setMessage(result.message ?? "Password updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reset password."); }
    finally { setSubmitting(false); }
  }

  return <main className="flex min-h-screen justify-center bg-zinc-50"><section className="w-full max-w-md bg-white px-6 py-12">
    <h1 className="text-3xl font-bold text-zinc-900">Choose a new password</h1><p className="mt-2 text-sm text-zinc-600">Use at least 10 characters. Reset links expire after 30 minutes.</p>
    <form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm font-medium text-zinc-800">New password<input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-blue-600" /></label>
      <label className="block text-sm font-medium text-zinc-800">Confirm new password<input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-blue-600" /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message} <Link href="/login" className="font-semibold underline">Sign in</Link></div>}
      <button disabled={submitting || !token || Boolean(message)} className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Updating…" : "Update password"}</button>
    </form><p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-blue-700 hover:underline">Back to sign in</Link></p>
  </section></main>;
}

export function ResetPasswordContent() {
  return <Suspense fallback={<main className="min-h-screen bg-white" />}><ResetPasswordForm /></Suspense>;
}
