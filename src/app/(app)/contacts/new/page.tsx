"use client";

import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ContactForm } from "@/components/contacts/contact-form";

export default function NewContactPage() {
  const router = useRouter();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Contacts", href: "/contacts" },
          { label: "Add Contact" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Add Contact
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Create a new contact in your database.
      </p>

      <div className="mt-6 max-w-2xl">
        <ContactForm onSuccess={() => router.push("/contacts")} />
      </div>
    </div>
  );
}
