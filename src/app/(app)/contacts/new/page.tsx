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
      <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
        Add Contact
      </h1>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Add a new contact to your network.
      </p>

      <div className="mt-6 max-w-2xl">
        <ContactForm onSuccess={() => router.push("/contacts")} />
      </div>
    </div>
  );
}
