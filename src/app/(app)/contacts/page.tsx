"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ContactList } from "@/components/contacts/contact-list";

export default function ContactsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Contacts" }]} />
      <ContactList />
    </div>
  );
}
