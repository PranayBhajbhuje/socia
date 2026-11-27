"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = fullName.trim().length >= 2 && EMAIL_RE.test(email.trim()) && password.length >= 10 && password.length <= 128;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not create account.");
        setSubmitting(false);
        return;
      }
      router.replace(`/login?created=1&email=${encodeURIComponent(email.trim())}`);
      router.refresh();
    } catch {
      setError("Network error while creating account.");
      setSubmitting(false);
    }
  }

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
    <section className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white px-6 py-10 dark:bg-neutral-950 sm:py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Create Account</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Join Socia and start connecting with people who inspire you.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label htmlFor="fullName" className={labelClass}>Full Name
            <input id="fullName" type="text" required minLength={2} maxLength={80} autoComplete="name" placeholder="Enter name" value={fullName} onChange={(event) => setFullName(event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label htmlFor="signup-email" className={labelClass}>Email
            <input id="signup-email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} inputMode="email" placeholder="name@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <div>
            <label htmlFor="signup-password" className={labelClass}>Create Password</label>
            <div className="relative">
              <input id="signup-password" type={showPassword ? "text" : "password"} required minLength={10} maxLength={128} autoComplete="new-password" placeholder="At least 10 characters" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="password-hint" className={`${inputClass} pr-16`} />
              <button type="button" onClick={() => setShowPassword((previous) => !previous)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-3 my-1 rounded-md px-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">{showPassword ? "Hide" : "Show"}</button>
            </div>
            <p id="password-hint" className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">Use 10 to 128 characters.</p>
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button type="submit" disabled={!isValid || submitting} aria-busy={submitting} className="w-full rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">{submitting ? "Creating account…" : "Create Account"}</button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">Already have an account? <Link href="/login" className="font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400">Log in</Link></p>
      </div>
      <p className="pt-8 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
    </section>
  </main>;
}
