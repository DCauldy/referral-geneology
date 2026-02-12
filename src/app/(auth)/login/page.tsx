"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleOAuthLogin(provider: "google") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-stone-950">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
              Back Home
            </Link>
            <div className="mt-6 flex items-center gap-2.5">
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
              <span className="font-serif text-xl font-semibold text-gray-900 dark:text-white">
                Trellis
              </span>
            </div>
            <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
              Not a member?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary-600 hover:text-primary-500"
              >
                Start a 14 day free trial
              </Link>
            </p>
          </div>

          <div className="mt-10">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-gray-200"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 dark:bg-stone-900 dark:text-white dark:outline-stone-700 dark:placeholder:text-gray-500 dark:focus:outline-primary-500 sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-gray-200"
                >
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 dark:bg-stone-900 dark:text-white dark:outline-stone-700 dark:placeholder:text-gray-500 dark:focus:outline-primary-500 sm:text-sm/6"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input
                        id="remember-me"
                        type="checkbox"
                        name="remember-me"
                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-primary-600 checked:bg-primary-600 indeterminate:border-primary-600 indeterminate:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-stone-600 dark:bg-stone-900 dark:checked:border-primary-500 dark:checked:bg-primary-500 dark:disabled:border-stone-700 dark:disabled:bg-stone-800 forced-colors:appearance-auto"
                      />
                      <svg
                        viewBox="0 0 14 14"
                        fill="none"
                        className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                      >
                        <path
                          d="M3 8L6 11L11 3.5"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-has-checked:opacity-100"
                        />
                        <path
                          d="M3 7H11"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-has-indeterminate:opacity-100"
                        />
                      </svg>
                    </div>
                  </div>
                  <label
                    htmlFor="remember-me"
                    className="block text-sm/6 text-gray-900 dark:text-gray-300"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm/6">
                  <Link
                    href="/forgot-password"
                    className="font-semibold text-primary-600 hover:text-primary-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <div className="mt-10">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center"
                >
                  <div className="w-full border-t border-gray-200 dark:border-stone-700" />
                </div>
                <div className="relative flex justify-center text-sm/6 font-medium">
                  <span className="bg-white px-6 text-gray-900 dark:bg-stone-950 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("google")}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:inset-ring-transparent dark:bg-stone-900 dark:text-gray-200 dark:inset-ring-stone-700 dark:hover:bg-stone-800"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span className="text-sm/6 font-semibold">Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2830&q=80"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    </div>
  );
}
