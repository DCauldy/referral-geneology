-- Migration 00021: Exclude drafts from trust scores and achievement counts
-- The refresh_trust_score() function was counting draft exchanges in total_sent,
-- which caused achievements to fire when a user saved a draft instead of sending.
-- The insert trigger also fired on draft creation, prematurely computing scores.

-- 1. Replace refresh_trust_score() to exclude drafts
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
    -- Sending stats (exclude drafts)
    select
        count(*),
        count(*) filter (where status = 'accepted'),
        count(*) filter (where status = 'declined'),
        count(*) filter (where receiver_status = 'converted')
    into v_total_sent, v_sent_accepted, v_sent_declined, v_sent_converted
    from referral_exchanges
    where sender_user_id = target_user_id
      and status != 'draft';

    -- Receiving stats (drafts never have receiver_user_id, but be explicit)
    select
        count(*),
        count(*) filter (where status = 'accepted'),
        count(*) filter (where status = 'declined'),
        count(*) filter (where receiver_status = 'converted')
    into v_total_received, v_recv_accepted, v_recv_declined, v_recv_converted
    from referral_exchanges
    where receiver_user_id = target_user_id
      and status != 'draft';

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

-- 2. Replace the trigger function to skip drafts entirely
create or replace function trg_refresh_trust_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Skip trust score refresh for drafts
    if new.status = 'draft' then
        return new;
    end if;

    -- Refresh sender's trust score
    perform refresh_trust_score(new.sender_user_id);

    -- Refresh receiver's trust score if set
    if new.receiver_user_id is not null then
        perform refresh_trust_score(new.receiver_user_id);
    end if;

    return new;
end;
$$;
