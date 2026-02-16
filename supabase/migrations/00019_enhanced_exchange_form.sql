-- Migration 00019: Enhanced exchange form fields
-- Adds structured fields for richer referral context, draft support, and tag system extension.

begin;

-- ============================================================
-- 1. New columns on referral_exchanges
-- ============================================================

alter table referral_exchanges
  add column if not exists interest_level   text,
  add column if not exists contact_approach text,
  add column if not exists internal_notes   text,
  add column if not exists sender_metadata  jsonb not null default '{}',
  add column if not exists notify_on_connect boolean not null default false,
  add column if not exists remind_follow_up  boolean not null default false;

-- CHECK constraints for enum-style columns
alter table referral_exchanges
  add constraint exchange_interest_level_check
    check (interest_level is null or interest_level in (
      'just_curious', 'exploring_options', 'actively_looking', 'ready_soon', 'ready_now'
    ));

alter table referral_exchanges
  add constraint exchange_contact_approach_check
    check (contact_approach is null or contact_approach in (
      'they_will_contact', 'please_reach_out', 'intro_already_made', 'timing_tbd'
    ));

-- ============================================================
-- 2. Status constraint update — add 'draft'
-- ============================================================

alter table referral_exchanges
  drop constraint if exists referral_exchanges_status_check;

alter table referral_exchanges
  add constraint referral_exchanges_status_check
    check (status in (
      'draft', 'pending', 'accepted', 'declined', 'expired', 'undeliverable'
    ));

-- ============================================================
-- 3. Receiver constraint — drafts can omit receiver_email
-- ============================================================

alter table referral_exchanges
  drop constraint if exists exchange_has_receiver;

alter table referral_exchanges
  add constraint exchange_has_receiver
    check (status = 'draft' or receiver_email is not null);

-- ============================================================
-- 4. Trigger changes — skip drafts, resolve on publish
-- ============================================================

-- Update existing resolve_exchange_receiver to skip drafts
create or replace function resolve_exchange_receiver()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_receiver_id uuid;
    v_is_paid boolean;
begin
    -- Skip resolution for drafts
    if new.status = 'draft' then
        return new;
    end if;

    -- Skip if no receiver email (shouldn't happen for non-drafts due to CHECK)
    if new.receiver_email is null then
        return new;
    end if;

    -- Look up user by email in auth.users
    select id into v_receiver_id
    from auth.users
    where email = new.receiver_email
    limit 1;

    if v_receiver_id is not null then
        v_is_paid := is_paid_user(v_receiver_id);

        if v_is_paid then
            new.receiver_user_id := v_receiver_id;
        else
            new.status := 'undeliverable';
        end if;
    end if;

    return new;
end;
$$;

-- New function: resolve receiver when a draft is published
create or replace function resolve_exchange_on_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_receiver_id uuid;
    v_is_paid boolean;
begin
    -- Only fire when transitioning from draft to pending
    if old.status <> 'draft' or new.status <> 'pending' then
        return new;
    end if;

    -- Receiver email is required (enforced by CHECK, but be safe)
    if new.receiver_email is null then
        return new;
    end if;

    -- Look up user by email in auth.users
    select id into v_receiver_id
    from auth.users
    where email = new.receiver_email
    limit 1;

    if v_receiver_id is not null then
        v_is_paid := is_paid_user(v_receiver_id);

        if v_is_paid then
            new.receiver_user_id := v_receiver_id;
        else
            new.status := 'undeliverable';
        end if;
    end if;

    return new;
end;
$$;

create trigger trg_resolve_exchange_on_publish
    before update on referral_exchanges
    for each row execute function resolve_exchange_on_publish();

-- ============================================================
-- 5. RLS policy updates — allow draft operations
-- ============================================================

drop policy if exists "exchanges_sender_update" on referral_exchanges;

create policy "exchanges_sender_update"
    on referral_exchanges for update
    using (
        sender_user_id = auth.uid()
        and status in ('draft', 'pending')
    )
    with check (
        sender_user_id = auth.uid()
    );

drop policy if exists "exchanges_sender_delete" on referral_exchanges;

create policy "exchanges_sender_delete"
    on referral_exchanges for delete
    using (
        sender_user_id = auth.uid()
        and status in ('draft', 'pending')
    );

-- ============================================================
-- 6. Tag system extension — add 'exchange' entity type
-- ============================================================

alter table tags
  drop constraint if exists tags_entity_type_check;

alter table tags
  add constraint tags_entity_type_check
    check (entity_type in ('contact', 'company', 'deal', 'exchange'));

-- ============================================================
-- 7. Index for draft queries
-- ============================================================

create index if not exists idx_exchanges_drafts
    on referral_exchanges (sender_user_id, updated_at desc)
    where status = 'draft';

commit;
