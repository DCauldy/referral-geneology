-- =============================================================================
-- Trust Scores - Exchange Trust & Feedback System (Phase 4)
-- =============================================================================
-- This migration creates the trust scoring system:
--   - exchange_trust_scores table (cached per-user metrics)
--   - refresh_trust_score() function to recompute from exchange data
--   - Trigger on referral_exchanges to auto-refresh on status changes
--   - RLS policies (public read, system-only write)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE: exchange_trust_scores
-- ---------------------------------------------------------------------------

create table exchange_trust_scores (
    id                  uuid        primary key default gen_random_uuid(),
    user_id             uuid        unique not null references auth.users(id) on delete cascade,

    -- Sending metrics
    total_sent          integer     default 0,
    sent_accepted       integer     default 0,
    sent_declined       integer     default 0,
    sent_converted      integer     default 0,

    -- Receiving metrics
    total_received      integer     default 0,
    received_accepted   integer     default 0,
    received_declined   integer     default 0,
    received_converted  integer     default 0,

    -- Computed scores (0-100)
    acceptance_rate     numeric(5,2) default 0,
    conversion_rate     numeric(5,2) default 0,
    responsiveness      numeric(5,2) default 0,
    trust_rating        numeric(5,2) default 0,

    -- Average response time in hours
    avg_response_hours  numeric(10,2) default 0,

    -- Timestamps
    last_computed_at    timestamptz default now(),
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

create index idx_trust_scores_user
    on exchange_trust_scores (user_id);

create index idx_trust_scores_rating
    on exchange_trust_scores (trust_rating desc);

-- ---------------------------------------------------------------------------
-- 3. TRIGGERS
-- ---------------------------------------------------------------------------

create trigger trg_trust_scores_updated_at
    before update on exchange_trust_scores
    for each row execute function handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4. FUNCTION: refresh_trust_score
-- ---------------------------------------------------------------------------
-- Recomputes trust metrics for a given user from referral_exchanges data.
-- Called after exchange status changes.

create or replace function refresh_trust_score(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_total_sent        integer := 0;
    v_sent_accepted     integer := 0;
    v_sent_declined     integer := 0;
    v_sent_converted    integer := 0;
    v_total_received    integer := 0;
    v_recv_accepted     integer := 0;
    v_recv_declined     integer := 0;
    v_recv_converted    integer := 0;
    v_avg_response      numeric := 0;
    v_acceptance_rate   numeric := 0;
    v_conversion_rate   numeric := 0;
    v_responsiveness    numeric := 0;
    v_trust_rating      numeric := 0;
begin
    -- Sending stats
    select
        count(*),
        count(*) filter (where status = 'accepted'),
        count(*) filter (where status = 'declined'),
        count(*) filter (where receiver_status = 'converted')
    into v_total_sent, v_sent_accepted, v_sent_declined, v_sent_converted
    from referral_exchanges
    where sender_user_id = target_user_id;

    -- Receiving stats
    select
        count(*),
        count(*) filter (where status = 'accepted'),
        count(*) filter (where status = 'declined'),
        count(*) filter (where receiver_status = 'converted')
    into v_total_received, v_recv_accepted, v_recv_declined, v_recv_converted
    from referral_exchanges
    where receiver_user_id = target_user_id;

    -- Average response time (hours between created_at and accepted_at/declined_at)
    select coalesce(avg(
        extract(epoch from (
            coalesce(accepted_at, declined_at) - created_at
        )) / 3600.0
    ), 0)
    into v_avg_response
    from referral_exchanges
    where receiver_user_id = target_user_id
      and (accepted_at is not null or declined_at is not null);

    -- Acceptance rate: what % of received exchanges were accepted
    if v_total_received > 0 then
        v_acceptance_rate := round((v_recv_accepted::numeric / v_total_received) * 100, 2);
    end if;

    -- Conversion rate: what % of sent exchanges led to conversion
    if v_sent_accepted > 0 then
        v_conversion_rate := round((v_sent_converted::numeric / v_sent_accepted) * 100, 2);
    end if;

    -- Responsiveness: score based on avg response time (faster = higher)
    -- <1h = 100, <6h = 90, <24h = 75, <72h = 50, >72h = 25
    if v_total_received > 0 and v_avg_response > 0 then
        v_responsiveness := case
            when v_avg_response <= 1 then 100
            when v_avg_response <= 6 then 90
            when v_avg_response <= 24 then 75
            when v_avg_response <= 72 then 50
            else 25
        end;
    end if;

    -- Overall trust rating (weighted composite)
    -- 40% acceptance rate + 30% conversion rate + 30% responsiveness
    -- Minimum 3 total exchanges to get a meaningful score
    if (v_total_sent + v_total_received) >= 3 then
        v_trust_rating := round(
            (v_acceptance_rate * 0.4) +
            (v_conversion_rate * 0.3) +
            (v_responsiveness * 0.3),
            2
        );
    end if;

    -- Upsert the trust score record
    insert into exchange_trust_scores (
        user_id,
        total_sent, sent_accepted, sent_declined, sent_converted,
        total_received, received_accepted, received_declined, received_converted,
        avg_response_hours,
        acceptance_rate, conversion_rate, responsiveness, trust_rating,
        last_computed_at
    ) values (
        target_user_id,
        v_total_sent, v_sent_accepted, v_sent_declined, v_sent_converted,
        v_total_received, v_recv_accepted, v_recv_declined, v_recv_converted,
        v_avg_response,
        v_acceptance_rate, v_conversion_rate, v_responsiveness, v_trust_rating,
        now()
    )
    on conflict (user_id)
    do update set
        total_sent = excluded.total_sent,
        sent_accepted = excluded.sent_accepted,
        sent_declined = excluded.sent_declined,
        sent_converted = excluded.sent_converted,
        total_received = excluded.total_received,
        received_accepted = excluded.received_accepted,
        received_declined = excluded.received_declined,
        received_converted = excluded.received_converted,
        avg_response_hours = excluded.avg_response_hours,
        acceptance_rate = excluded.acceptance_rate,
        conversion_rate = excluded.conversion_rate,
        responsiveness = excluded.responsiveness,
        trust_rating = excluded.trust_rating,
        last_computed_at = excluded.last_computed_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. TRIGGER: Auto-refresh trust scores on exchange status change
-- ---------------------------------------------------------------------------

create or replace function trg_refresh_trust_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Refresh sender's trust score
    perform refresh_trust_score(new.sender_user_id);

    -- Refresh receiver's trust score if set
    if new.receiver_user_id is not null then
        perform refresh_trust_score(new.receiver_user_id);
    end if;

    return new;
end;
$$;

create trigger trg_exchange_refresh_trust
    after update of status, receiver_status on referral_exchanges
    for each row execute function trg_refresh_trust_scores();

-- Also refresh on insert (new exchange sent)
create trigger trg_exchange_insert_refresh_trust
    after insert on referral_exchanges
    for each row execute function trg_refresh_trust_scores();

-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table exchange_trust_scores enable row level security;

-- Anyone on a paid plan can read trust scores (public reputation)
create policy "trust_scores_select"
    on exchange_trust_scores for select
    using (true);

-- Only the system (security definer functions) can write
-- No insert/update/delete policies for regular users

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------
