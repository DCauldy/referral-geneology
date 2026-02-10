import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          About
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          The story behind Referral Genealogy.
        </p>
      </div>

      <div className="mt-12 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Our Mission
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Referral Genealogy helps professionals and teams visualize, track, and
            grow their referral networks. We believe that understanding the
            genealogy of your referrals unlocks insights that drive better
            relationships and more business.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            What We Do
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            We provide a modern platform for mapping referral chains, managing
            deals through customizable pipelines, and leveraging AI to surface
            insights about your network. From individual professionals to growing
            teams, our tools help you understand the true value of every
            connection.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Get in Touch
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Have questions or want to learn more? We would love to hear from you.
          </p>
          <div className="mt-4">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
