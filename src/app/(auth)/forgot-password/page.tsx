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
    <div className="flex min-h-screen items-center justify-center bg-primary-50/50 px-4 dark:bg-primary-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2.5">
            <svg className="h-9 w-9 shrink-0" viewBox="0 0 48 48" fill="none">
              <line x1="24" y1="6" x2="12" y2="18" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="24" y1="6" x2="36" y2="18" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="8" y2="32" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="24" y2="32" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="36" y1="18" x2="24" y2="32" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="36" y1="18" x2="40" y2="32" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="32" x2="16" y2="42" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="24" y1="32" x2="16" y2="42" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="24" y1="32" x2="32" y2="42" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="40" y1="32" x2="32" y2="42" stroke="#2f5435" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="36" y2="18" stroke="#2f5435" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
              <line x1="8" y1="32" x2="40" y2="32" stroke="#2f5435" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
              <circle cx="24" cy="6" r="3.5" fill="#2f5435" stroke="#fff" strokeWidth="1.5" />
              <circle cx="12" cy="18" r="3" fill="#5d8a5a" stroke="#fff" strokeWidth="1.5" />
              <circle cx="36" cy="18" r="3" fill="#5d8a5a" stroke="#fff" strokeWidth="1.5" />
              <circle cx="8" cy="32" r="2.5" fill="#c4a96a" stroke="#fff" strokeWidth="1.2" />
              <circle cx="24" cy="32" r="3" fill="#5d8a5a" stroke="#fff" strokeWidth="1.5" />
              <circle cx="40" cy="32" r="2.5" fill="#c4a96a" stroke="#fff" strokeWidth="1.2" />
              <circle cx="16" cy="42" r="2.5" fill="#b09352" stroke="#fff" strokeWidth="1.2" />
              <circle cx="32" cy="42" r="2.5" fill="#b09352" stroke="#fff" strokeWidth="1.2" />
            </svg>
            <span className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">
              Trellis
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
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
