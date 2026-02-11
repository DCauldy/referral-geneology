-- =============================================================================
-- Referral Exchange - Inter-Network Referral Passing (Phase 1)
-- =============================================================================
-- This migration creates the cross-tenant referral exchange system:
--   - referral_exchanges table (crosses org boundaries by design)
--   - Helper function to check sender/receiver plan eligibility
--   - RLS policies scoped to sender_user_id / receiver_user_id
--   - Indexes for inbox/outbox queries
--   - Trigger for updated_at
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. HELPER: Check if a user is on a paid plan
-- ---------------------------------------------------------------------------

create or replace function is_paid_user(check_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    return exists (
        select 1
        from user_profiles up
        join organizations o on o.id = up.active_org_id
        where up.id = check_user_id
          and o.plan in ('pro', 'team')
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. TABLE: referral_exchanges
-- ---------------------------------------------------------------------------

create table referral_exchanges (
    id                  uuid        primary key default gen_random_uuid(),
    token               text        unique not null default encode(gen_random_bytes(16), 'hex'),

    -- Sender side
    sender_user_id      uuid        not null references auth.users(id) on delete cascade,
    sender_org_id       uuid        not null references organizations(id) on delete cascade,

    -- Receiver side (one of these must be set)
    receiver_user_id    uuid        references auth.users(id) on delete set null,
    receiver_email      text        not null,

    -- Shared contact data (controlled subset chosen by sender)
    contact_snapshot    jsonb       not null,
    context_note        text,

    -- Source contact in sender's org (for tracking)
    source_contact_id   uuid        references contacts(id) on delete set null,

    -- Lifecycle
    status              text        not null default 'pending'
                                    check (status in (
                                        'pending', 'accepted', 'declined',
                                        'expired', 'undeliverable'
                                    )),

    -- Receiver feedback (opt-in visibility back to sender)
    receiver_status     text        default 'none'
                                    check (receiver_status in (
                                        'none', 'in_progress', 'converted', 'lost'
                                    )),
    receiver_status_visible boolean default false,

    -- Receiver's imported contact (set on accept)
    imported_contact_id uuid        references contacts(id) on delete set null,

    -- Timestamps
    accepted_at         timestamptz,
    declined_at         timestamptz,
    expires_at          timestamptz default (now() + interval '30 days'),
    created_at          timestamptz default now(),
    updated_at          timestamptz default now(),

    -- At least receiver_email must be set
    constraint exchange_has_receiver check (receiver_email is not null)
);

-- ---------------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------------

-- Outbox: sender's sent referrals
create index idx_exchanges_sender
    on referral_exchanges (sender_user_id, created_at desc);

-- Inbox: receiver's received referrals
create index idx_exchanges_receiver
    on referral_exchanges (receiver_user_id, created_at desc)
    where receiver_user_id is not null;

-- Token lookup (for email claim flow)
create index idx_exchanges_token
    on referral_exchanges (token)
    where status = 'pending';

-- Source contact tracking
create index idx_exchanges_source_contact
    on referral_exchanges (source_contact_id)
    where source_contact_id is not null;

-- ---------------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------------

create trigger trg_referral_exchanges_updated_at
    before update on referral_exchanges
    for each row execute function handle_updated_at();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table referral_exchanges enable row level security;

-- Sender can see their own sent exchanges
create policy "exchanges_sender_select"
    on referral_exchanges for select
    using (sender_user_id = auth.uid());

-- Receiver can see exchanges sent to them (only if on paid plan)
create policy "exchanges_receiver_select"
    on referral_exchanges for select
    using (
        receiver_user_id = auth.uid()
        and is_paid_user(auth.uid())
    );

-- Only paid users can insert (send) exchanges
create policy "exchanges_insert"
    on referral_exchanges for insert
    with check (
        sender_user_id = auth.uid()
        and is_paid_user(auth.uid())
    );

-- Receiver can update (accept/decline) their received exchanges
create policy "exchanges_receiver_update"
    on referral_exchanges for update
    using (
        receiver_user_id = auth.uid()
        and is_paid_user(auth.uid())
    )
    with check (
        receiver_user_id = auth.uid()
    );

-- Sender can update their own exchanges (e.g., cancel pending)
create policy "exchanges_sender_update"
    on referral_exchanges for update
    using (
        sender_user_id = auth.uid()
        and status = 'pending'
    )
    with check (
        sender_user_id = auth.uid()
    );

-- Only sender can delete their pending exchanges
create policy "exchanges_sender_delete"
    on referral_exchanges for delete
    using (
        sender_user_id = auth.uid()
        and status = 'pending'
    );

-- ---------------------------------------------------------------------------
-- 6. FUNCTION: Resolve receiver user ID from email
-- ---------------------------------------------------------------------------
-- Called after insert to match receiver_email to an existing user.
-- If the user exists and is on a paid plan, sets receiver_user_id.
-- If the user exists but is on free plan, sets status to 'undeliverable'.

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
    -- Look up user by email in auth.users
    select id into v_receiver_id
    from auth.users
    where email = new.receiver_email
    limit 1;

    if v_receiver_id is not null then
        -- Check if receiver is on a paid plan
        v_is_paid := is_paid_user(v_receiver_id);

        if v_is_paid then
            new.receiver_user_id := v_receiver_id;
        else
            new.status := 'undeliverable';
        end if;
    end if;
    -- If no user found, receiver_user_id stays null (email invite flow)

    return new;
end;
$$;

create trigger trg_resolve_exchange_receiver
    before insert on referral_exchanges
    for each row execute function resolve_exchange_receiver();

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------
