"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ContactDetail } from "@/components/contacts/contact-detail";

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Contacts", href: "/contacts" },
          { label: "Contact Detail" },
        ]}
      />
      <ContactDetail contactId={id} />
    </div>
  );
}
