-- Add contact email and phone to directory profiles so users can share contact info publicly
ALTER TABLE directory_profiles ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE directory_profiles ADD COLUMN IF NOT EXISTS contact_phone text;
