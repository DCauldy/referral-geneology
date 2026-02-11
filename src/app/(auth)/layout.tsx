export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          {children}
        </div>
      </div>
    </div>
  );
}
