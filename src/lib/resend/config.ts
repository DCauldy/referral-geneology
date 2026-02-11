export function getFromAddress(orgName?: string): string {
  const email = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";
  if (orgName) {
    return `${orgName} <${email}>`;
  }
  return email;
}

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

export function interpolateTemplate(
  html: string,
  variables: Record<string, string>
): string {
  return html.replace(VARIABLE_REGEX, (match, key: string) => {
    return variables[key] ?? match;
  });
}

export function extractVariables(html: string): string[] {
  const vars = new Set<string>();
  let match;
  const regex = /\{\{(\w+)\}\}/g;
  while ((match = regex.exec(html)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

export const TEMPLATE_VARIABLES = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "company_name", label: "Company Name" },
  { key: "job_title", label: "Job Title" },
] as const;

export function buildContactVariables(contact: {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  job_title?: string | null;
  company?: { name: string } | null;
}): Record<string, string> {
  return {
    first_name: contact.first_name,
    last_name: contact.last_name || "",
    full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
    email: contact.email || "",
    company_name: contact.company?.name || "",
    job_title: contact.job_title || "",
  };
}
