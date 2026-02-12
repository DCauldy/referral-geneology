"use client";

import { ContactList } from "@/components/contacts/contact-list";

export default function ContactsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Contacts
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Manage the people in your network.
      </p>
      <ContactList />
    </div>
  );
}
