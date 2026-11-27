"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const inputClass = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);
  const [developmentResetUrl, setDevelopmentResetUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setDeliveryAvailable(null);
    setDevelopmentResetUrl("");
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { message?: string; error?: string; deliveryAvailable?: boolean; developmentResetUrl?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not request a password reset.");
      setMessage(result.message ?? "Could not request a password reset.");
      setDeliveryAvailable(result.deliveryAvailable ?? null);
      setDevelopmentResetUrl(result.developmentResetUrl ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request a password reset.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
    <section className="flex min-h-screen w-full max-w-md flex-col bg-white px-6 py-10 dark:bg-neutral-950 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Forgot password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Enter the email address linked to your Socia account.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label htmlFor="reset-email" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">Email
          <input id="reset-email" name="email" required type="email" inputMode="email" autoCapitalize="none" autoComplete="email" spellCheck={false} value={email} onChange={(event) => { setEmail(event.target.value); setError(""); setMessage(""); setDeliveryAvailable(null); setDevelopmentResetUrl(""); }} aria-invalid={Boolean(error)} className={inputClass} />
        </label>
        {message && <div role="status" className={`rounded-xl border p-3 text-sm ${deliveryAvailable === false ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200" : "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"}`}><p>{developmentResetUrl ? "Email delivery is not configured here. Continue with the local reset link below." : message}</p>{developmentResetUrl && <Link href={developmentResetUrl} className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-amber-900 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-white">Continue to password reset</Link>}</div>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <button type="submit" disabled={submitting} aria-busy={submitting} className="w-full rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">{submitting ? "Sending…" : "Send reset instructions"}</button>
      </form>
      <p className="mt-7 border-t border-zinc-200 pt-5 text-center text-sm dark:border-zinc-800"><Link href="/login" className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Back to sign in</Link></p>
    </section>
  </main>;
}
