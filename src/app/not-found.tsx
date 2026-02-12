import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center">
      {/* Background image with overlay */}
      <img
        src="https://images.unsplash.com/photo-1545972154-9bb223aac798?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=3050&q=80&exp=8&con=-15&sat=-75"
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover object-top"
      />
      <div className="absolute inset-0 -z-10 bg-primary-950/60" />

      <div className="mx-auto max-w-7xl px-6 py-32 text-center sm:py-40 lg:px-8">
        <p className="font-sans text-base/8 font-semibold text-tan-400">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl">
          This branch has been pruned
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-white/70 sm:text-xl/8">
          Looks like this part of the tree never took root. No fruit to harvest here.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="text-sm/7 font-semibold text-tan-300 transition hover:text-tan-200"
          >
            <span aria-hidden="true">&larr;</span> Back to the grove
          </Link>
        </div>
      </div>
    </main>
  );
}
