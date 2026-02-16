import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "contact-photos";
const COMPANY_BUCKET = "contact-photos"; // reuse same bucket, different path prefix

/**
 * Upload a contact photo and return its public URL.
 * Path: contact-photos/{orgId}/{contactId}/{timestamp}.{ext}
 */
export async function uploadContactPhoto(
  supabase: SupabaseClient,
  orgId: string,
  contactId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${orgId}/${contactId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete a contact photo by its public URL.
 * Extracts the storage path from the URL and removes the file.
 */
export async function deleteContactPhoto(
  supabase: SupabaseClient,
  publicUrl: string
): Promise<void> {
  // Public URLs look like: .../storage/v1/object/public/contact-photos/{path}
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const path = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

/**
 * Upload a company logo and return its public URL.
 * Path: contact-photos/companies/{orgId}/{companyId}/{timestamp}.{ext}
 */
export async function uploadCompanyLogo(
  supabase: SupabaseClient,
  orgId: string,
  companyId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `companies/${orgId}/${companyId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(COMPANY_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(COMPANY_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete a company logo by its public URL.
 */
export async function deleteCompanyLogo(
  supabase: SupabaseClient,
  publicUrl: string
): Promise<void> {
  const marker = `/storage/v1/object/public/${COMPANY_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const path = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(COMPANY_BUCKET).remove([path]);
  if (error) throw error;
}
