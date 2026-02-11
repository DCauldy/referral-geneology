-- =============================================================================
-- Automations Feature - Schema Migration
-- =============================================================================
-- This migration creates the automation/email tables including:
--   - email_templates: Reusable HTML email templates
--   - automations: Automation definitions with trigger config
--   - automation_steps: Ordered steps (email/delay/condition)
--   - automation_enrollments: Contacts enrolled in automations
--   - email_logs: Email send tracking with Resend integration
--   - Indexes for org-scoped lookups and cron queries
--   - RLS policies (20 total, 4 per table)
--   - Auto-enrollment triggers for contact create and tag added
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

-- 1a. email_templates -------------------------------------------------------
create table email_templates (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    name            text        not null,
    subject         text        not null default '',
    html_content    text        not null default '',
    text_content    text        not null default '',
    variables       jsonb       default '[]',
    is_archived     boolean     default false,
    created_by      uuid        references auth.users on delete set null,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 1b. automations -----------------------------------------------------------
create table automations (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    name            text        not null,
    description     text,
    status          text        not null default 'draft'
                                check (status in ('draft', 'active', 'paused', 'archived')),
    trigger_type    text        not null default 'manual'
                                check (trigger_type in ('manual', 'on_contact_create', 'on_tag_added')),
    trigger_config  jsonb       default '{}',
    stats           jsonb       default '{"sent": 0, "opened": 0, "clicked": 0, "bounced": 0}',
    created_by      uuid        references auth.users on delete set null,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- 1c. automation_steps ------------------------------------------------------
create table automation_steps (
    id              uuid        primary key default gen_random_uuid(),
    automation_id   uuid        not null references automations on delete cascade,
    step_order      int         not null default 0,
    step_type       text        not null default 'email'
                                check (step_type in ('email', 'delay', 'condition')),
    template_id     uuid        references email_templates on delete set null,
    subject_override text,
    delay_amount    int         default 0,
    delay_unit      text        default 'days'
                                check (delay_unit in ('minutes', 'hours', 'days', 'weeks')),
    config          jsonb       default '{}',
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique (automation_id, step_order)
);

-- 1d. automation_enrollments ------------------------------------------------
create table automation_enrollments (
    id              uuid        primary key default gen_random_uuid(),
    automation_id   uuid        not null references automations on delete cascade,
    contact_id      uuid        not null references contacts on delete cascade,
    status          text        not null default 'active'
                                check (status in ('active', 'completed', 'paused', 'canceled', 'failed')),
    current_step_order int      not null default 0,
    next_action_at  timestamptz default now(),
    started_at      timestamptz default now(),
    completed_at    timestamptz,
    error_message   text,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique (automation_id, contact_id)
);

-- 1e. email_logs ------------------------------------------------------------
create table email_logs (
    id              uuid        primary key default gen_random_uuid(),
    org_id          uuid        not null references organizations on delete cascade,
    enrollment_id   uuid        references automation_enrollments on delete set null,
    automation_id   uuid        references automations on delete set null,
    step_id         uuid        references automation_steps on delete set null,
    template_id     uuid        references email_templates on delete set null,
    contact_id      uuid        references contacts on delete set null,
    resend_id       text,
    to_email        text        not null,
    subject         text        not null,
    status          text        not null default 'queued'
                                check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
    error_message   text,
    opened_at       timestamptz,
    clicked_at      timestamptz,
    bounced_at      timestamptz,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

-- Org-scoped lookups
create index idx_email_templates_org on email_templates(org_id);
create index idx_automations_org on automations(org_id);
create index idx_email_logs_org on email_logs(org_id);

-- Automation step ordering
create index idx_automation_steps_automation on automation_steps(automation_id, step_order);

-- Enrollment lookups
create index idx_enrollments_automation on automation_enrollments(automation_id);
create index idx_enrollments_contact on automation_enrollments(contact_id);

-- Cron query: active enrollments ready for processing
create index idx_enrollments_next_action
    on automation_enrollments(status, next_action_at)
    where status = 'active';

-- Webhook lookup by Resend ID
create index idx_email_logs_resend_id on email_logs(resend_id) where resend_id is not null;

-- Email log lookups
create index idx_email_logs_automation on email_logs(automation_id);
create index idx_email_logs_contact on email_logs(contact_id);
create index idx_email_logs_template on email_logs(template_id);

-- ---------------------------------------------------------------------------
-- 3. TRIGGERS (updated_at)
-- ---------------------------------------------------------------------------

create trigger set_email_templates_updated_at
    before update on email_templates
    for each row execute function handle_updated_at();

create trigger set_automations_updated_at
    before update on automations
    for each row execute function handle_updated_at();

create trigger set_automation_steps_updated_at
    before update on automation_steps
    for each row execute function handle_updated_at();

create trigger set_automation_enrollments_updated_at
    before update on automation_enrollments
    for each row execute function handle_updated_at();

create trigger set_email_logs_updated_at
    before update on email_logs
    for each row execute function handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table email_templates enable row level security;
alter table automations enable row level security;
alter table automation_steps enable row level security;
alter table automation_enrollments enable row level security;
alter table email_logs enable row level security;

-- ---- email_templates ------------------------------------------------------

create policy "email_templates_select"
    on email_templates for select
    using (is_org_member(org_id));

create policy "email_templates_insert"
    on email_templates for insert
    with check (is_org_member(org_id));

create policy "email_templates_update"
    on email_templates for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "email_templates_delete"
    on email_templates for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- automations ----------------------------------------------------------

create policy "automations_select"
    on automations for select
    using (is_org_member(org_id));

create policy "automations_insert"
    on automations for insert
    with check (is_org_member(org_id));

create policy "automations_update"
    on automations for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "automations_delete"
    on automations for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---- automation_steps (gated via automation's org) ------------------------

create policy "automation_steps_select"
    on automation_steps for select
    using (
        exists (
            select 1 from automations a
            where a.id = automation_steps.automation_id
              and is_org_member(a.org_id)
        )
    );

create policy "automation_steps_insert"
    on automation_steps for insert
    with check (
        exists (
            select 1 from automations a
            where a.id = automation_steps.automation_id
              and is_org_member(a.org_id)
        )
    );

create policy "automation_steps_update"
    on automation_steps for update
    using (
        exists (
            select 1 from automations a
            where a.id = automation_steps.automation_id
              and get_org_role(a.org_id) in ('owner', 'admin', 'member')
        )
    );

create policy "automation_steps_delete"
    on automation_steps for delete
    using (
        exists (
            select 1 from automations a
            where a.id = automation_steps.automation_id
              and get_org_role(a.org_id) in ('owner', 'admin')
        )
    );

-- ---- automation_enrollments (gated via automation's org) ------------------

create policy "automation_enrollments_select"
    on automation_enrollments for select
    using (
        exists (
            select 1 from automations a
            where a.id = automation_enrollments.automation_id
              and is_org_member(a.org_id)
        )
    );

create policy "automation_enrollments_insert"
    on automation_enrollments for insert
    with check (
        exists (
            select 1 from automations a
            where a.id = automation_enrollments.automation_id
              and is_org_member(a.org_id)
        )
    );

create policy "automation_enrollments_update"
    on automation_enrollments for update
    using (
        exists (
            select 1 from automations a
            where a.id = automation_enrollments.automation_id
              and get_org_role(a.org_id) in ('owner', 'admin', 'member')
        )
    );

create policy "automation_enrollments_delete"
    on automation_enrollments for delete
    using (
        exists (
            select 1 from automations a
            where a.id = automation_enrollments.automation_id
              and get_org_role(a.org_id) in ('owner', 'admin')
        )
    );

-- ---- email_logs -----------------------------------------------------------

create policy "email_logs_select"
    on email_logs for select
    using (is_org_member(org_id));

create policy "email_logs_insert"
    on email_logs for insert
    with check (is_org_member(org_id));

create policy "email_logs_update"
    on email_logs for update
    using (get_org_role(org_id) in ('owner', 'admin', 'member'));

create policy "email_logs_delete"
    on email_logs for delete
    using (get_org_role(org_id) in ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- 5. AUTO-ENROLLMENT FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------------

-- 5a. On contact create → auto-enroll in matching automations
create or replace function handle_automation_contact_created()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into automation_enrollments (automation_id, contact_id, status, current_step_order, next_action_at)
    select a.id, new.id, 'active', 0, now()
    from automations a
    where a.org_id = new.org_id
      and a.status = 'active'
      and a.trigger_type = 'on_contact_create'
    on conflict (automation_id, contact_id) do nothing;

    return new;
end;
$$;

create trigger trg_automation_contact_created
    after insert on contacts
    for each row execute function handle_automation_contact_created();

-- 5b. On tag added → auto-enroll in matching automations
create or replace function handle_automation_tag_added()
returns trigger
language plpgsql
security definer
as $$
declare
    v_contact_org_id uuid;
begin
    -- Only act on contact tags
    if new.entity_type <> 'contact' then
        return new;
    end if;

    -- Get the contact's org_id
    select org_id into v_contact_org_id
    from contacts
    where id = new.entity_id;

    if v_contact_org_id is null then
        return new;
    end if;

    insert into automation_enrollments (automation_id, contact_id, status, current_step_order, next_action_at)
    select a.id, new.entity_id, 'active', 0, now()
    from automations a
    where a.org_id = v_contact_org_id
      and a.status = 'active'
      and a.trigger_type = 'on_tag_added'
      and a.trigger_config->>'tag_id' = new.tag_id::text
    on conflict (automation_id, contact_id) do nothing;

    return new;
end;
$$;

create trigger trg_automation_tag_added
    after insert on entity_tags
    for each row execute function handle_automation_tag_added();
