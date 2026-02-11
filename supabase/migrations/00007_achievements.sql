-- =============================================================================
-- Gamification & Achievements (Phase 6)
-- =============================================================================
-- This migration creates:
--   - user_achievements table (personal achievement records)
--   - user_streaks table (daily login / activity streaks)
--   - check_achievements() function (compares counts against thresholds)
--   - update_user_streak() function (tracks consecutive active days)
--   - get_org_leaderboard() function (team leaderboard)
--   - get_directory_leaderboard() function (public leaderboard)
--   - RLS policies (users can read own rows only)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE: user_achievements
-- ---------------------------------------------------------------------------

create table user_achievements (
    id                  uuid        primary key default gen_random_uuid(),
    user_id             uuid        not null references auth.users(id) on delete cascade,
    achievement_key     text        not null,
    tier                text        not null check (tier in ('bronze', 'silver', 'gold')),
    points              integer     not null default 0,
    unlocked_at         timestamptz not null default now(),
    notified            boolean     not null default false,

    unique (user_id, achievement_key, tier)
);

create index idx_user_achievements_user on user_achievements (user_id);
create index idx_user_achievements_key on user_achievements (achievement_key);

-- ---------------------------------------------------------------------------
-- 2. TABLE: user_streaks
-- ---------------------------------------------------------------------------

create table user_streaks (
    id                  uuid        primary key default gen_random_uuid(),
    user_id             uuid        not null references auth.users(id) on delete cascade,
    org_id              uuid        not null references organizations(id) on delete cascade,
    current_streak      integer     not null default 0,
    longest_streak      integer     not null default 0,
    last_active_date    date,

    unique (user_id, org_id)
);

create index idx_user_streaks_user_org on user_streaks (user_id, org_id);

-- ---------------------------------------------------------------------------
-- 3. FUNCTION: check_achievements
-- ---------------------------------------------------------------------------
-- Queries current counts and compares against hardcoded thresholds.
-- Inserts new achievements via ON CONFLICT DO NOTHING.
-- Returns JSON array of newly unlocked {achievement_key, tier, points}.

create or replace function check_achievements(
    target_user_id uuid,
    target_org_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_contact_count       integer := 0;
    v_company_count       integer := 0;
    v_deal_count          integer := 0;
    v_won_deal_count      integer := 0;
    v_won_revenue         numeric := 0;
    v_referral_count      integer := 0;
    v_converted_referrals integer := 0;
    v_conversion_rate     numeric := 0;
    v_activity_count      integer := 0;
    v_automation_count    integer := 0;
    v_insight_count       integer := 0;
    v_onboarding_done     boolean := false;
    v_exchange_sent       integer := 0;
    v_exchange_received   integer := 0;
    v_exchange_converted  integer := 0;
    v_trust_rating        numeric := 0;
    v_streak_days         integer := 0;
    v_before_count        integer := 0;
    v_after_count         integer := 0;
    v_newly_unlocked      jsonb;
begin
    -- Snapshot existing count
    select count(*) into v_before_count
    from user_achievements where user_id = target_user_id;

    -- ---- Gather counts ----

    select count(*) into v_contact_count
    from contacts where org_id = target_org_id;

    select count(*) into v_company_count
    from companies where org_id = target_org_id;

    select count(*) into v_deal_count
    from deals where org_id = target_org_id;

    select count(*), coalesce(sum(value), 0)
    into v_won_deal_count, v_won_revenue
    from deals where org_id = target_org_id and status = 'won';

    select count(*) into v_referral_count
    from referrals where org_id = target_org_id;

    select count(*) into v_converted_referrals
    from referrals where org_id = target_org_id and status = 'converted';

    if v_referral_count >= 10 then
        v_conversion_rate := round((v_converted_referrals::numeric / v_referral_count) * 100, 2);
    end if;

    select count(*) into v_activity_count
    from activities where org_id = target_org_id;

    select count(*) into v_automation_count
    from automations where org_id = target_org_id and status != 'draft';

    select count(*) into v_insight_count
    from ai_insights where org_id = target_org_id and is_dismissed = false;

    select coalesce(onboarding_completed, false)
    into v_onboarding_done
    from user_profiles where id = target_user_id;

    -- Exchange metrics (may not exist for free users)
    select coalesce(total_sent, 0), coalesce(total_received, 0),
           coalesce(sent_converted + received_converted, 0),
           coalesce(trust_rating, 0)
    into v_exchange_sent, v_exchange_received, v_exchange_converted, v_trust_rating
    from exchange_trust_scores where user_id = target_user_id;

    -- Streak
    select coalesce(current_streak, 0) into v_streak_days
    from user_streaks where user_id = target_user_id and org_id = target_org_id;

    -- ---- Getting Started achievements ----

    if v_contact_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_branch', 'gold', 10)
        on conflict do nothing;
    end if;

    if v_company_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_root', 'gold', 10)
        on conflict do nothing;
    end if;

    if v_deal_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_fruit', 'gold', 10)
        on conflict do nothing;
    end if;

    if v_referral_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_growth', 'gold', 10)
        on conflict do nothing;
    end if;

    if v_onboarding_done then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seedling', 'gold', 15)
        on conflict do nothing;
    end if;

    -- ---- Growth achievements (tiered) ----

    -- Branch Collector: 10/50/100 contacts
    if v_contact_count >= 100 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'branch_collector', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_contact_count >= 50 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'branch_collector', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_contact_count >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'branch_collector', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Root System: 5/25/100 companies
    if v_company_count >= 100 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'root_system', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_company_count >= 25 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'root_system', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_company_count >= 5 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'root_system', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Abundant Harvest: $1K/$10K/$100K won revenue
    if v_won_revenue >= 100000 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'abundant_harvest', 'gold', 75)
        on conflict do nothing;
    end if;
    if v_won_revenue >= 10000 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'abundant_harvest', 'silver', 35)
        on conflict do nothing;
    end if;
    if v_won_revenue >= 1000 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'abundant_harvest', 'bronze', 15)
        on conflict do nothing;
    end if;

    -- Fruit Bearer: 5/25/100 won deals
    if v_won_deal_count >= 100 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'fruit_bearer', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_won_deal_count >= 25 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'fruit_bearer', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_won_deal_count >= 5 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'fruit_bearer', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- ---- Networking achievements ----

    -- Growth Spreader: 10/50/100 referrals
    if v_referral_count >= 100 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'growth_spreader', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_referral_count >= 50 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'growth_spreader', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_referral_count >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'growth_spreader', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Fruitful Growth: 1/10/25 converted referrals
    if v_converted_referrals >= 25 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'fruitful_growth', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_converted_referrals >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'fruitful_growth', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_converted_referrals >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'fruitful_growth', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Master Grower: 25%/50%/75% conversion rate (min 10 referrals)
    if v_referral_count >= 10 then
        if v_conversion_rate >= 75 then
            insert into user_achievements (user_id, achievement_key, tier, points)
            values (target_user_id, 'master_grower', 'gold', 75)
            on conflict do nothing;
        end if;
        if v_conversion_rate >= 50 then
            insert into user_achievements (user_id, achievement_key, tier, points)
            values (target_user_id, 'master_grower', 'silver', 35)
            on conflict do nothing;
        end if;
        if v_conversion_rate >= 25 then
            insert into user_achievements (user_id, achievement_key, tier, points)
            values (target_user_id, 'master_grower', 'bronze', 15)
            on conflict do nothing;
        end if;
    end if;

    -- ---- Exchange achievements (paid plan only — caller checks plan) ----

    -- Seed Sower: 1/10/50 sent exchanges
    if v_exchange_sent >= 50 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seed_sower', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_exchange_sent >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seed_sower', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_exchange_sent >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seed_sower', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Seed Collector: 1/10/50 received exchanges
    if v_exchange_received >= 50 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seed_collector', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_exchange_received >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seed_collector', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_exchange_received >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seed_collector', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Cross-Pollinator: 1/5/25 converted exchanges
    if v_exchange_converted >= 25 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'cross_pollinator', 'gold', 75)
        on conflict do nothing;
    end if;
    if v_exchange_converted >= 5 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'cross_pollinator', 'silver', 35)
        on conflict do nothing;
    end if;
    if v_exchange_converted >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'cross_pollinator', 'bronze', 15)
        on conflict do nothing;
    end if;

    -- Trusted Grower: trust rating 40/60/80
    if v_trust_rating >= 80 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'trusted_grower', 'gold', 75)
        on conflict do nothing;
    end if;
    if v_trust_rating >= 60 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'trusted_grower', 'silver', 35)
        on conflict do nothing;
    end if;
    if v_trust_rating >= 40 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'trusted_grower', 'bronze', 15)
        on conflict do nothing;
    end if;

    -- ---- Engagement achievements ----

    -- Growth Logger: 10/50/200 activities
    if v_activity_count >= 200 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'growth_logger', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_activity_count >= 50 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'growth_logger', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_activity_count >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'growth_logger', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Auto-Cultivator: 1 active automation
    if v_automation_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'auto_cultivator', 'gold', 20)
        on conflict do nothing;
    end if;

    -- Orchard Oracle: 1 AI insight
    if v_insight_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'orchard_oracle', 'gold', 20)
        on conflict do nothing;
    end if;

    -- ---- Streak achievements ----

    -- Steady Grower: 7/30/90 day streak
    if v_streak_days >= 90 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'steady_grower', 'gold', 75)
        on conflict do nothing;
    end if;
    if v_streak_days >= 30 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'steady_grower', 'silver', 35)
        on conflict do nothing;
    end if;
    if v_streak_days >= 7 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'steady_grower', 'bronze', 15)
        on conflict do nothing;
    end if;

    -- ---- Determine newly unlocked ----

    select count(*) into v_after_count
    from user_achievements where user_id = target_user_id;

    if v_after_count > v_before_count then
        select coalesce(jsonb_agg(jsonb_build_object(
            'achievement_key', achievement_key,
            'tier', tier,
            'points', points
        )), '[]'::jsonb)
        into v_newly_unlocked
        from user_achievements
        where user_id = target_user_id
          and notified = false;
    else
        v_newly_unlocked := '[]'::jsonb;
    end if;

    return v_newly_unlocked;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. FUNCTION: update_user_streak
-- ---------------------------------------------------------------------------

create or replace function update_user_streak(
    target_user_id uuid,
    target_org_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_last_active date;
    v_today       date := current_date;
    v_current     integer;
    v_longest     integer;
begin
    select last_active_date, current_streak, longest_streak
    into v_last_active, v_current, v_longest
    from user_streaks
    where user_id = target_user_id and org_id = target_org_id;

    if not found then
        -- First time: insert a new streak record
        insert into user_streaks (user_id, org_id, current_streak, longest_streak, last_active_date)
        values (target_user_id, target_org_id, 1, 1, v_today);
        return;
    end if;

    -- Already active today: no-op
    if v_last_active = v_today then
        return;
    end if;

    -- Active yesterday: increment streak
    if v_last_active = v_today - 1 then
        v_current := v_current + 1;
        if v_current > v_longest then
            v_longest := v_current;
        end if;
    else
        -- Gap: reset streak to 1
        v_current := 1;
    end if;

    update user_streaks
    set current_streak = v_current,
        longest_streak = v_longest,
        last_active_date = v_today
    where user_id = target_user_id and org_id = target_org_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. FUNCTION: get_org_leaderboard
-- ---------------------------------------------------------------------------

create or replace function get_org_leaderboard(target_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_result jsonb;
begin
    select coalesce(jsonb_agg(row_data order by total_points desc), '[]'::jsonb)
    into v_result
    from (
        select
            jsonb_build_object(
                'user_id', om.user_id,
                'full_name', coalesce(up.full_name, 'Team Member'),
                'avatar_url', up.avatar_url,
                'total_points', coalesce(pts.total_points, 0),
                'achievement_count', coalesce(pts.achievement_count, 0)
            ) as row_data,
            coalesce(pts.total_points, 0) as total_points
        from org_members om
        join user_profiles up on up.id = om.user_id
        left join (
            select user_id,
                   sum(points) as total_points,
                   count(*) as achievement_count
            from user_achievements
            group by user_id
        ) pts on pts.user_id = om.user_id
        where om.org_id = target_org_id
    ) sub;

    return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. FUNCTION: get_directory_leaderboard
-- ---------------------------------------------------------------------------

create or replace function get_directory_leaderboard(limit_count integer default 25)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_result jsonb;
begin
    select coalesce(jsonb_agg(row_data order by total_points desc), '[]'::jsonb)
    into v_result
    from (
        select
            jsonb_build_object(
                'user_id', dp.user_id,
                'display_name', dp.display_name,
                'avatar_url', dp.avatar_url,
                'company_name', dp.company_name,
                'total_points', coalesce(pts.total_points, 0),
                'achievement_count', coalesce(pts.achievement_count, 0)
            ) as row_data,
            coalesce(pts.total_points, 0) as total_points
        from directory_profiles dp
        left join (
            select user_id,
                   sum(points) as total_points,
                   count(*) as achievement_count
            from user_achievements
            group by user_id
        ) pts on pts.user_id = dp.user_id
        where dp.is_visible = true
        order by coalesce(pts.total_points, 0) desc
        limit limit_count
    ) sub;

    return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table user_achievements enable row level security;
alter table user_streaks enable row level security;

-- Users can read their own achievements
create policy "user_achievements_select_own"
    on user_achievements for select
    using (auth.uid() = user_id);

-- Users can read their own streaks
create policy "user_streaks_select_own"
    on user_streaks for select
    using (auth.uid() = user_id);

-- No direct insert/update/delete — handled by security definer functions

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------
