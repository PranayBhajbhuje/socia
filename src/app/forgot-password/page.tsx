"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [developmentResetUrl, setDevelopmentResetUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage(""); setError(""); setDevelopmentResetUrl("");
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const result = (await response.json()) as { message?: string; error?: string; developmentResetUrl?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not request a reset link.");
      setMessage(result.message ?? "If an account exists, reset instructions will be sent.");
      setDevelopmentResetUrl(result.developmentResetUrl ?? "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not request a reset link."); }
    finally { setSubmitting(false); }
  }

  return <main className="flex min-h-screen justify-center bg-zinc-50"><section className="w-full max-w-md bg-white px-6 py-12">
    <h1 className="text-3xl font-bold text-zinc-900">Forgot password?</h1><p className="mt-2 text-sm text-zinc-600">Enter the email for your Socia account and we’ll send reset instructions.</p>
    <form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-medium text-zinc-800">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-blue-600" /></label>
      {message && <div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800"><p>{message}</p>{developmentResetUrl && <><p className="mt-2 text-xs">Local development email is not configured. Use this link to finish the reset:</p><a href={developmentResetUrl} className="mt-2 inline-block font-semibold underline">Open password reset</a></>}</div>}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={submitting} className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Sending…" : "Send reset link"}</button>
    </form><p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-blue-700 hover:underline">Back to sign in</Link></p>
  </section></main>;
}
