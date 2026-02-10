-- =============================================================================
-- Referral Genealogy SaaS Platform - Initial Schema Migration
-- =============================================================================
-- This migration creates the complete database schema including:
--   - Extensions (pg_trgm, uuid-ossp)
--   - All tables with proper dependency ordering
--   - Indexes (including trigram for fuzzy search)
--   - Database functions (auth helpers, referral chain walker, triggers)
--   - Triggers (updated_at, new user provisioning)
--   - Row Level Security policies on all data tables
--   - Materialized view for org-level statistics
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;   -- fuzzy / trigram search
create extension if not exists "uuid-ossp"; -- uuid_generate_v4()

-- ---------------------------------------------------------------------------
-- 2. TABLES (dependency-ordered)
-- ---------------------------------------------------------------------------

-- 2a. organizations --------------------------------------------------------
create table organizations (
    id              uuid        primary key default gen_random_uuid(),
    name            text        not null,
    slug            text        unique not null,
    logo_url        text,
    website         text,
    industry        text,
    plan            text        default 'free'
                                check (plan in ('free', 'pro', 'team')),
    polar_customer_id     text,
    polar_subscription_id text,
    subscription_status   text,
    max_contacts    int         default 50,
    max_users       int         default 1,
    settings        jsonb       default '{}',
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 2b. org_members ----------------------------------------------------------
create table org_members (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    user_id         uuid        not null references auth.users on delete cascade,
    role            text        default 'member'
                                check (role in ('owner', 'admin', 'member', 'viewer')),
    invited_email   text,
    invited_at      timestamptz,
    accepted_at     timestamptz,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique (org_id, user_id)
);

-- 2c. user_profiles --------------------------------------------------------
create table user_profiles (
    id                      uuid        primary key references auth.users on delete cascade,
    full_name               text,
    avatar_url              text,
    phone                   text,
    job_title               text,
    active_org_id           uuid        references organizations on delete set null,
    onboarding_completed    boolean     default false,
    preferences             jsonb       default '{}',
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

-- 2d. companies (before contacts, because contacts references companies) ---
create table companies (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    name            text        not null,
    industry        text,
    website         text,
    phone           text,
    email           text,
    address_line1   text,
    address_line2   text,
    city            text,
    state_province  text,
    postal_code     text,
    country         text,
    employee_count  int,
    annual_revenue  numeric,
    description     text,
    logo_url        text,
    linkedin_url    text,
    custom_fields   jsonb       default '{}',
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 2e. contacts -------------------------------------------------------------
create table contacts (
    id                      uuid        primary key default gen_random_uuid(),
    org_id                  uuid        not null references organizations on delete cascade,
    first_name              text        not null,
    last_name               text,
    email                   text,
    phone                   text,
    mobile_phone            text,
    job_title               text,
    company_id              uuid        references companies on delete set null,
    industry                text,
    address_line1           text,
    address_line2           text,
    city                    text,
    state_province          text,
    postal_code             text,
    country                 text,
    linkedin_url            text,
    twitter_url             text,
    facebook_url            text,
    website_url             text,
    relationship_type       text        default 'contact'
                                        check (relationship_type in (
                                            'contact', 'client', 'referral_partner',
                                            'vendor', 'colleague', 'friend'
                                        )),
    referral_score          numeric     default 0,
    lifetime_referral_value numeric     default 0,
    rating                  int,
    profile_photo_url       text,
    notes                   text,
    custom_fields           jsonb       default '{}',
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

-- 2f. tags -----------------------------------------------------------------
create table tags (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    name            text        not null,
    color           text        default '#6b7280',
    entity_type     text        not null
                                check (entity_type in ('contact', 'company', 'deal')),
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique (org_id, name, entity_type)
);

-- 2g. entity_tags (polymorphic junction) -----------------------------------
create table entity_tags (
    id              uuid        primary key default gen_random_uuid(),
    tag_id          uuid        not null references tags on delete cascade,
    entity_type     text        not null,
    entity_id       uuid        not null,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique (tag_id, entity_type, entity_id)
);

-- 2h. pipeline_stages ------------------------------------------------------
create table pipeline_stages (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    name            text        not null,
    display_order   int         not null,
    color           text        default '#94a3b8',
    is_won          boolean     default false,
    is_lost         boolean     default false,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 2i. deals ----------------------------------------------------------------
create table deals (
    id                  uuid        primary key default gen_random_uuid(),
    org_id              uuid        not null references organizations on delete cascade,
    name                text        not null,
    value               numeric,
    currency            text        default 'USD',
    stage_id            uuid        references pipeline_stages on delete set null,
    probability         numeric,
    contact_id          uuid        references contacts on delete set null,
    company_id          uuid        references companies on delete set null,
    deal_type           text        default 'one_time'
                                    check (deal_type in (
                                        'one_time', 'recurring', 'retainer', 'project'
                                    )),
    recurring_interval  text,
    recurring_value     numeric,
    expected_close_date date,
    actual_close_date   date,
    status              text        default 'open'
                                    check (status in ('open', 'won', 'lost', 'abandoned')),
    description         text,
    notes               text,
    custom_fields       jsonb       default '{}',
    assigned_to         uuid        references auth.users on delete set null,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

-- 2j. referrals (core referral graph edges) --------------------------------
create table referrals (
    id                  uuid        primary key default gen_random_uuid(),
    org_id              uuid        not null references organizations on delete cascade,
    referrer_id         uuid        not null references contacts on delete cascade,
    referred_id         uuid        not null references contacts on delete cascade,
    deal_id             uuid        references deals on delete set null,
    referral_date       date        default current_date,
    referral_type       text        default 'direct'
                                    check (referral_type in (
                                        'direct', 'introduction', 'recommendation', 'mutual'
                                    )),
    status              text        default 'pending'
                                    check (status in (
                                        'pending', 'active', 'converted', 'inactive', 'declined'
                                    )),
    referral_value      numeric,
    depth               int         default 0,
    root_referrer_id    uuid        references contacts on delete set null,
    notes               text,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now(),
    constraint referrals_no_self_referral check (referrer_id != referred_id)
);

-- Partial unique indexes to handle nullable deal_id:
-- When deal_id IS NOT NULL, enforce (org_id, referrer_id, referred_id, deal_id) uniqueness.
create unique index uq_referrals_with_deal
    on referrals (org_id, referrer_id, referred_id, deal_id)
    where deal_id is not null;

-- When deal_id IS NULL, enforce (org_id, referrer_id, referred_id) uniqueness.
create unique index uq_referrals_without_deal
    on referrals (org_id, referrer_id, referred_id)
    where deal_id is null;

-- 2k. activities (polymorphic timeline) ------------------------------------
create table activities (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    entity_type     text        not null,
    entity_id       uuid        not null,
    activity_type   text        not null,
    title           text        not null,
    description     text,
    metadata        jsonb       default '{}',
    created_by      uuid        references auth.users on delete set null,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 2l. documents (file attachments) -----------------------------------------
create table documents (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    entity_type     text        not null,
    entity_id       uuid        not null,
    file_name       text        not null,
    file_type       text,
    file_size       bigint,
    storage_path    text        not null,
    uploaded_by     uuid        references auth.users on delete set null,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 2m. ai_insights ----------------------------------------------------------
create table ai_insights (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    insight_type    text        not null
                                check (insight_type in (
                                    'referral_pattern', 'top_referrers', 'network_gap',
                                    'deal_prediction', 'cluster_analysis', 'growth_opportunity'
                                )),
    title           text        not null,
    summary         text        not null,
    details         jsonb       default '{}',
    confidence      numeric,
    is_dismissed    boolean     default false,
    expires_at      timestamptz,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 2n. saved_views ----------------------------------------------------------
create table saved_views (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    user_id         uuid        not null references auth.users on delete cascade,
    name            text        not null,
    view_type       text        not null
                                check (view_type in ('tree', 'network', 'galaxy')),
    config          jsonb       default '{}',
    is_default      boolean     default false,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 2o. import_jobs ----------------------------------------------------------
create table import_jobs (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    user_id         uuid        not null references auth.users on delete cascade,
    file_name       text        not null,
    entity_type     text        not null,
    status          text        default 'pending'
                                check (status in ('pending', 'processing', 'completed', 'failed')),
    total_rows      int         default 0,
    processed_rows  int         default 0,
    error_rows      int         default 0,
    errors          jsonb       default '[]',
    field_mapping   jsonb       default '{}',
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------------

-- contacts: trigram index for fuzzy name search
create index idx_contacts_name_trgm
    on contacts
    using gin ((first_name || ' ' || coalesce(last_name, '')) gin_trgm_ops);

create index idx_contacts_org_email        on contacts (org_id, email);
create index idx_contacts_org_industry     on contacts (org_id, industry);
create index idx_contacts_org_rel_type     on contacts (org_id, relationship_type);
create index idx_contacts_org_company      on contacts (org_id, company_id);

-- companies: trigram index for fuzzy name search
create index idx_companies_name_trgm
    on companies
    using gin (name gin_trgm_ops);

create index idx_companies_org_industry    on companies (org_id, industry);

-- activities: composite index for timeline lookups
create index idx_activities_entity_timeline
    on activities (org_id, entity_type, entity_id, created_at desc);

-- referrals: lookup indexes for graph traversal
create index idx_referrals_referrer        on referrals (org_id, referrer_id);
create index idx_referrals_referred        on referrals (org_id, referred_id);

-- deals: common lookups
create index idx_deals_org_status          on deals (org_id, status);
create index idx_deals_org_stage           on deals (org_id, stage_id);
create index idx_deals_org_contact         on deals (org_id, contact_id);

-- org_members: fast user-to-org lookups
create index idx_org_members_user          on org_members (user_id);

-- entity_tags: reverse lookup by entity
create index idx_entity_tags_entity        on entity_tags (entity_type, entity_id);

-- documents: entity lookup
create index idx_documents_entity          on documents (org_id, entity_type, entity_id);

-- ai_insights: active insights lookup
create index idx_ai_insights_org_type      on ai_insights (org_id, insight_type)
    where is_dismissed = false;

-- import_jobs: active jobs
create index idx_import_jobs_org_status    on import_jobs (org_id, status);

-- ---------------------------------------------------------------------------
-- 4. DATABASE FUNCTIONS
-- ---------------------------------------------------------------------------

-- 4a. get_active_org_id() --------------------------------------------------
create or replace function get_active_org_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
begin
    select active_org_id into v_org_id
    from user_profiles
    where id = auth.uid();

    return v_org_id;
end;
$$;

-- 4b. is_org_member(check_org_id uuid) ------------------------------------
create or replace function is_org_member(check_org_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    return exists (
        select 1
        from org_members
        where org_id  = check_org_id
          and user_id = auth.uid()
    );
end;
$$;

-- 4c. get_org_role(check_org_id uuid) -------------------------------------
create or replace function get_org_role(check_org_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_role text;
begin
    select role into v_role
    from org_members
    where org_id  = check_org_id
      and user_id = auth.uid();

    return v_role;
end;
$$;

-- 4d. get_referral_chain() -------------------------------------------------
create or replace function get_referral_chain(
    p_org_id    uuid,
    p_contact_id uuid,
    p_direction text default 'downstream',
    p_max_depth int  default 10
)
returns table (
    contact_id  uuid,
    first_name  text,
    last_name   text,
    depth       int,
    path        uuid[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    return query
    with recursive chain as (
        -- Base case: the starting contact at depth 0
        select
            c.id            as contact_id,
            c.first_name,
            c.last_name,
            0               as depth,
            array[c.id]     as path
        from contacts c
        where c.id     = p_contact_id
          and c.org_id = p_org_id

        union all

        -- Recursive step
        select
            next_c.id           as contact_id,
            next_c.first_name,
            next_c.last_name,
            ch.depth + 1        as depth,
            ch.path || next_c.id as path
        from chain ch
        join referrals r
            on r.org_id = p_org_id
            and case
                    when p_direction = 'downstream' then
                        r.referrer_id = ch.contact_id
                    else
                        r.referred_id = ch.contact_id
                end
        join contacts next_c
            on next_c.id = case
                               when p_direction = 'downstream' then r.referred_id
                               else r.referrer_id
                           end
           and next_c.org_id = p_org_id
        where ch.depth < p_max_depth
          -- Prevent cycles: only visit nodes not already in the path
          and not (next_c.id = any(ch.path))
    )
    select
        chain.contact_id,
        chain.first_name,
        chain.last_name,
        chain.depth,
        chain.path
    from chain
    order by chain.depth, chain.contact_id;
end;
$$;

-- 4e. handle_updated_at() --------------------------------------------------
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- 4f. handle_new_user() ----------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id   uuid;
    v_slug     text;
    v_email    text;
begin
    -- Derive email from the new auth.users row
    v_email := new.email;

    -- Generate a unique slug from a random uuid fragment
    v_slug := 'org-' || replace(gen_random_uuid()::text, '-', '');

    -- Create personal organization
    insert into organizations (name, slug)
    values (coalesce(v_email, 'My Organization'), v_slug)
    returning id into v_org_id;

    -- Create org membership as owner
    insert into org_members (org_id, user_id, role, accepted_at)
    values (v_org_id, new.id, 'owner', now());

    -- Create user profile with active_org set
    insert into user_profiles (id, full_name, active_org_id)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        v_org_id
    );

    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. TRIGGERS
-- ---------------------------------------------------------------------------

-- 5a. updated_at triggers on every table that has the column ---------------

create trigger trg_organizations_updated_at
    before update on organizations
    for each row execute function handle_updated_at();

create trigger trg_org_members_updated_at
    before update on org_members
    for each row execute function handle_updated_at();

create trigger trg_user_profiles_updated_at
    before update on user_profiles
    for each row execute function handle_updated_at();

create trigger trg_companies_updated_at
    before update on companies
    for each row execute function handle_updated_at();

create trigger trg_contacts_updated_at
    before update on contacts
    for each row execute function handle_updated_at();

create trigger trg_tags_updated_at
    before update on tags
    for each row execute function handle_updated_at();

create trigger trg_entity_tags_updated_at
    before update on entity_tags
    for each row execute function handle_updated_at();

create trigger trg_pipeline_stages_updated_at
    before update on pipeline_stages
    for each row execute function handle_updated_at();

create trigger trg_deals_updated_at
    before update on deals
    for each row execute function handle_updated_at();

create trigger trg_referrals_updated_at
    before update on referrals
    for each row execute function handle_updated_at();

create trigger trg_activities_updated_at
    before update on activities
    for each row execute function handle_updated_at();

create trigger trg_documents_updated_at
    before update on documents
    for each row execute function handle_updated_at();

create trigger trg_ai_insights_updated_at
    before update on ai_insights
    for each row execute function handle_updated_at();

create trigger trg_saved_views_updated_at
    before update on saved_views
    for each row execute function handle_updated_at();

create trigger trg_import_jobs_updated_at
    before update on import_jobs
    for each row execute function handle_updated_at();

-- 5b. New user provisioning trigger ----------------------------------------

create trigger trg_on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- Enable RLS on all data tables
alter table organizations   enable row level security;
alter table org_members      enable row level security;
alter table user_profiles    enable row level security;
alter table companies        enable row level security;
alter table contacts         enable row level security;
alter table tags             enable row level security;
alter table entity_tags      enable row level security;
alter table pipeline_stages  enable row level security;
alter table deals            enable row level security;
alter table referrals        enable row level security;
alter table activities       enable row level security;
alter table documents        enable row level security;
alter table ai_insights      enable row level security;
alter table saved_views      enable row level security;
alter table import_jobs      enable row level security;

-- ---- organizations -------------------------------------------------------

create policy "org_select"
    on organizations for select
    using (is_org_member(id));

create policy "org_insert"
    on organizations for insert
    with check (true);  -- creation handled by handle_new_user or app logic

create policy "org_update"
    on organizations for update
    using (get_org_role(id) = 'owner');

create policy "org_delete"
    on organizations for delete
    using (get_org_role(id) = 'owner');

-- ---- org_members ---------------------------------------------------------

create policy "org_members_select"
    on org_members for select
    using (is_org_member(org_id));

create policy "org_members_insert"
    on org_members for insert
    with check (get_org_role(org_id) in ('owner', 'admin'));

create policy "org_members_update"
    on org_members for update
    using (get_org_role(org_id) in ('owner', 'admin'));

create policy "org_members_delete"
    on org_members for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- user_profiles -------------------------------------------------------

create policy "user_profiles_select_own"
    on user_profiles for select
    using (id = auth.uid());

create policy "user_profiles_update_own"
    on user_profiles for update
    using (id = auth.uid());

create policy "user_profiles_insert_own"
    on user_profiles for insert
    with check (id = auth.uid());

-- ---- companies -----------------------------------------------------------

create policy "companies_select"
    on companies for select
    using (is_org_member(org_id));

create policy "companies_insert"
    on companies for insert
    with check (is_org_member(org_id));

create policy "companies_update"
    on companies for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "companies_delete"
    on companies for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- contacts ------------------------------------------------------------

create policy "contacts_select"
    on contacts for select
    using (is_org_member(org_id));

create policy "contacts_insert"
    on contacts for insert
    with check (is_org_member(org_id));

create policy "contacts_update"
    on contacts for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "contacts_delete"
    on contacts for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- tags ----------------------------------------------------------------

create policy "tags_select"
    on tags for select
    using (is_org_member(org_id));

create policy "tags_insert"
    on tags for insert
    with check (is_org_member(org_id));

create policy "tags_update"
    on tags for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "tags_delete"
    on tags for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- entity_tags ---------------------------------------------------------
-- entity_tags is polymorphic and does not carry org_id directly.
-- We gate via the tag's org membership.

create policy "entity_tags_select"
    on entity_tags for select
    using (
        exists (
            select 1 from tags t
            where t.id = entity_tags.tag_id
              and is_org_member(t.org_id)
        )
    );

create policy "entity_tags_insert"
    on entity_tags for insert
    with check (
        exists (
            select 1 from tags t
            where t.id = entity_tags.tag_id
              and is_org_member(t.org_id)
        )
    );

create policy "entity_tags_update"
    on entity_tags for update
    using (
        exists (
            select 1 from tags t
            where t.id = entity_tags.tag_id
              and get_org_role(t.org_id) in ('owner', 'admin', 'member')
        )
    );

create policy "entity_tags_delete"
    on entity_tags for delete
    using (
        exists (
            select 1 from tags t
            where t.id = entity_tags.tag_id
              and get_org_role(t.org_id) in ('owner', 'admin')
        )
    );

-- ---- pipeline_stages -----------------------------------------------------

create policy "pipeline_stages_select"
    on pipeline_stages for select
    using (is_org_member(org_id));

create policy "pipeline_stages_insert"
    on pipeline_stages for insert
    with check (is_org_member(org_id));

create policy "pipeline_stages_update"
    on pipeline_stages for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "pipeline_stages_delete"
    on pipeline_stages for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- deals ---------------------------------------------------------------

create policy "deals_select"
    on deals for select
    using (is_org_member(org_id));

create policy "deals_insert"
    on deals for insert
    with check (is_org_member(org_id));

create policy "deals_update"
    on deals for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "deals_delete"
    on deals for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- referrals -----------------------------------------------------------

create policy "referrals_select"
    on referrals for select
    using (is_org_member(org_id));

create policy "referrals_insert"
    on referrals for insert
    with check (is_org_member(org_id));

create policy "referrals_update"
    on referrals for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "referrals_delete"
    on referrals for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- activities ----------------------------------------------------------

create policy "activities_select"
    on activities for select
    using (is_org_member(org_id));

create policy "activities_insert"
    on activities for insert
    with check (is_org_member(org_id));

create policy "activities_update"
    on activities for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "activities_delete"
    on activities for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- documents -----------------------------------------------------------

create policy "documents_select"
    on documents for select
    using (is_org_member(org_id));

create policy "documents_insert"
    on documents for insert
    with check (is_org_member(org_id));

create policy "documents_update"
    on documents for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "documents_delete"
    on documents for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- ai_insights ---------------------------------------------------------

create policy "ai_insights_select"
    on ai_insights for select
    using (is_org_member(org_id));

create policy "ai_insights_insert"
    on ai_insights for insert
    with check (is_org_member(org_id));

create policy "ai_insights_update"
    on ai_insights for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "ai_insights_delete"
    on ai_insights for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- saved_views ---------------------------------------------------------

create policy "saved_views_select"
    on saved_views for select
    using (is_org_member(org_id));

create policy "saved_views_insert"
    on saved_views for insert
    with check (is_org_member(org_id));

create policy "saved_views_update"
    on saved_views for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "saved_views_delete"
    on saved_views for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- import_jobs ---------------------------------------------------------

create policy "import_jobs_select"
    on import_jobs for select
    using (is_org_member(org_id));

create policy "import_jobs_insert"
    on import_jobs for insert
    with check (is_org_member(org_id));

create policy "import_jobs_update"
    on import_jobs for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "import_jobs_delete"
    on import_jobs for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- 7. MATERIALIZED VIEW - Org Statistics
-- ---------------------------------------------------------------------------

create materialized view mv_org_stats as
select
    o.id                                                    as org_id,
    coalesce(ct.total_contacts, 0)                          as total_contacts,
    coalesce(co.total_companies, 0)                         as total_companies,
    coalesce(d.total_deals, 0)                              as total_deals,
    coalesce(r.total_referrals, 0)                          as total_referrals,
    coalesce(d.total_deal_value, 0)                         as total_deal_value,
    coalesce(d.won_deal_value, 0)                           as won_deal_value,
    coalesce(d.pipeline_value, 0)                           as pipeline_value,
    coalesce(r.avg_chain_depth, 0)                          as avg_chain_depth,
    case
        when coalesce(r.total_referrals, 0) = 0 then 0
        else round(
            coalesce(r.converted_referrals, 0)::numeric
            / r.total_referrals * 100, 2
        )
    end                                                     as conversion_rate
from organizations o

left join lateral (
    select count(*)::int as total_contacts
    from contacts c
    where c.org_id = o.id
) ct on true

left join lateral (
    select count(*)::int as total_companies
    from companies c
    where c.org_id = o.id
) co on true

left join lateral (
    select
        count(*)::int                                       as total_deals,
        coalesce(sum(value), 0)                             as total_deal_value,
        coalesce(sum(value) filter (where status = 'won'), 0)  as won_deal_value,
        coalesce(sum(value) filter (where status = 'open'), 0) as pipeline_value
    from deals d
    where d.org_id = o.id
) d on true

left join lateral (
    select
        count(*)::int                                       as total_referrals,
        coalesce(avg(depth), 0)                             as avg_chain_depth,
        count(*) filter (where status = 'converted')        as converted_referrals
    from referrals r
    where r.org_id = o.id
) r on true;

-- Unique index so we can use REFRESH MATERIALIZED VIEW CONCURRENTLY
create unique index idx_mv_org_stats_org_id on mv_org_stats (org_id);

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------
