"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const inputClass = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800";

export default function LoginForm({ accountCreated, initialEmail }: { accountCreated: boolean; initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to sign in.");
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
    <section className="flex min-h-screen w-full max-w-md flex-col bg-white px-6 py-10 dark:bg-neutral-950 sm:py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome Back!</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Log in to continue sharing, connecting, and discovering.</p>
        {accountCreated && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">Account created successfully. Sign in to continue.</p>}
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label htmlFor="login-email" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">Email
            <input id="login-email" name="email" required type="email" inputMode="email" autoCapitalize="none" autoComplete="email" spellCheck={false} value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} aria-invalid={Boolean(error)} className={inputClass} />
          </label>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">Password</label>
            <div className="relative">
              <input id="login-password" name="password" required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} className={`${inputClass} pr-16`} />
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-3 my-1 rounded-md px-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">{showPassword ? "Hide" : "Show"}</button>
            </div>
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Forgot password?</Link>
            </div>
          </div>
          {error && <p id="login-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button type="submit" disabled={!canSubmit || submitting} aria-busy={submitting} className="w-full rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">{submitting ? "Signing in…" : "Log in"}</button>
        </form>
        <div className="mt-7 border-t border-zinc-200 pt-5 text-center text-sm dark:border-zinc-800">
          <span className="text-zinc-600 dark:text-zinc-400">Don&apos;t have an account? </span>
          <Link href="/signup" className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Create account</Link>
        </div>
      </div>
    </section>
  </main>;
}
