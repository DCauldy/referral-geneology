"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ContactForm } from "@/components/contacts/contact-form";
import { useContact } from "@/lib/hooks/use-contacts";
import { Skeleton } from "@/components/shared/loading-skeleton";

export default function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { contact, isLoading } = useContact(id);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Contacts", href: "/contacts" },
          { label: "Contact Detail", href: `/contacts/${id}` },
          { label: "Edit" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Edit Contact
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Update contact information.
      </p>

      <div className="mt-6 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : contact ? (
          <ContactForm
            contact={contact}
            onSuccess={() => router.push(`/contacts/${id}`)}
          />
        ) : (
          <p className="text-sm text-red-500">Contact not found.</p>
        )}
      </div>
    </div>
  );
}
