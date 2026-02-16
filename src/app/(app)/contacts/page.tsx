"use client";

import { Suspense } from "react";
import { ContactList } from "@/components/contacts/contact-list";

export default function ContactsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
        Contacts
      </h1>
      <p className="mt-1 mb-6 text-sm text-primary-500 dark:text-primary-400">
        Manage your contacts and relationships.
      </p>
      <Suspense>
        <ContactList />
      </Suspense>
    </div>
  );
}
