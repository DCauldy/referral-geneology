"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50/40 px-4 dark:bg-stone-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            RG
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Referral Genealogy
          </h1>
        </div>
        <div className="rounded-xl border border-amber-200/60 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          {sent ? (
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Check your email
              </h2>
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium">{email}</span>
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Forgot your password?
              </h2>
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                <Link
                  href="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
