-- Platform admin flag for super-admin access
-- This column controls access to the /admin route group

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- Existing RLS select policy on user_profiles already restricts reads to the
-- user's own row, so is_platform_admin is only visible to the user themselves.
-- No additional RLS policies are needed because admin API routes use
-- createAdminClient() which bypasses RLS entirely.
