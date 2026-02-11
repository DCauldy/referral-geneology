-- =============================================================================
-- Directory Profiles - Opt-In User Directory (Phase 3)
-- =============================================================================
-- This migration creates the opt-in directory system:
--   - directory_profiles table (public-facing profile for paid users)
--   - RLS policies (public read for visible profiles, owner-only write)
--   - Indexes for search and filtering
--   - Updated_at trigger
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE: directory_profiles
-- ---------------------------------------------------------------------------

create table directory_profiles (
    id                  uuid        primary key default gen_random_uuid(),
    user_id             uuid        unique not null references auth.users(id) on delete cascade,

    -- Display info
    display_name        text        not null,
    company_name        text,
    industry            text,
    location            text,
    bio                 text,
    avatar_url          text,

    -- Referral preferences
    specialties         text[]      default '{}',
    referral_categories text[]      default '{}',
    accepts_referrals   boolean     default true,

    -- Visibility
    is_visible          boolean     default false,

    -- Timestamps
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

-- Visible profiles listing
create index idx_directory_visible
    on directory_profiles (is_visible, display_name)
    where is_visible = true;

-- Industry filter
create index idx_directory_industry
    on directory_profiles (industry)
    where is_visible = true and industry is not null;

-- Location filter
create index idx_directory_location
    on directory_profiles (location)
    where is_visible = true and location is not null;

-- Full-text search on display_name and company_name
create index idx_directory_search
    on directory_profiles using gin (
        to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(company_name, ''))
    );

-- Specialties search (GIN for array contains)
create index idx_directory_specialties
    on directory_profiles using gin (specialties)
    where is_visible = true;

-- User lookup
create index idx_directory_user
    on directory_profiles (user_id);

-- ---------------------------------------------------------------------------
-- 3. TRIGGERS
-- ---------------------------------------------------------------------------

create trigger trg_directory_profiles_updated_at
    before update on directory_profiles
    for each row execute function handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table directory_profiles enable row level security;

-- Anyone on a paid plan can read visible profiles
create policy "directory_visible_select"
    on directory_profiles for select
    using (
        is_visible = true
        and is_paid_user(user_id)
    );

-- Users can always read their own profile (even if not visible)
create policy "directory_own_select"
    on directory_profiles for select
    using (user_id = auth.uid());

-- Only paid users can insert their own profile
create policy "directory_insert"
    on directory_profiles for insert
    with check (
        user_id = auth.uid()
        and is_paid_user(auth.uid())
    );

-- Only the owner can update their own profile
create policy "directory_update"
    on directory_profiles for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Only the owner can delete their own profile
create policy "directory_delete"
    on directory_profiles for delete
    using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------
