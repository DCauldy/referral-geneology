-- =============================================================================
-- Tiered Achievements Update
-- =============================================================================
-- Converts previously single-tier achievements to bronze/silver/gold:
--   - first_branch (Contact Starter): 1/5/15 contacts
--   - first_root (Company Starter): 1/3/10 companies
--   - first_fruit (Deal Starter): 1/5/15 deals
--   - first_growth (Referral Starter): 1/5/15 referrals
--   - auto_cultivator (Automation Builder): 1/5/15 automations
--   - orchard_oracle (Insight Explorer): 1/10/50 insights
--
-- Existing single gold-tier rows are preserved (ON CONFLICT DO NOTHING).
-- New bronze/silver tiers are back-filled for users who already qualified.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Migrate existing single gold-tier achievements to new point values
-- ---------------------------------------------------------------------------

-- first_branch: was 10pts gold, now 20pts gold
update user_achievements
set points = 20
where achievement_key = 'first_branch' and tier = 'gold';

-- first_root: was 10pts gold, now 20pts gold
update user_achievements
set points = 20
where achievement_key = 'first_root' and tier = 'gold';

-- first_fruit: was 10pts gold, now 20pts gold
update user_achievements
set points = 20
where achievement_key = 'first_fruit' and tier = 'gold';

-- first_growth: was 10pts gold, now 20pts gold
update user_achievements
set points = 20
where achievement_key = 'first_growth' and tier = 'gold';

-- auto_cultivator: was 20pts gold, now 50pts gold
update user_achievements
set points = 50
where achievement_key = 'auto_cultivator' and tier = 'gold';

-- orchard_oracle: was 20pts gold, now 50pts gold
update user_achievements
set points = 50
where achievement_key = 'orchard_oracle' and tier = 'gold';

-- ---------------------------------------------------------------------------
-- 2. Back-fill bronze and silver tiers for users who already have gold
-- ---------------------------------------------------------------------------

-- first_branch: bronze (5pts) and silver (10pts) for users with gold
insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_branch', 'bronze', 5, true
from user_achievements where achievement_key = 'first_branch' and tier = 'gold'
on conflict do nothing;

insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_branch', 'silver', 10, true
from user_achievements where achievement_key = 'first_branch' and tier = 'gold'
on conflict do nothing;

-- first_root: bronze (5pts) and silver (10pts)
insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_root', 'bronze', 5, true
from user_achievements where achievement_key = 'first_root' and tier = 'gold'
on conflict do nothing;

insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_root', 'silver', 10, true
from user_achievements where achievement_key = 'first_root' and tier = 'gold'
on conflict do nothing;

-- first_fruit: bronze (5pts) and silver (10pts)
insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_fruit', 'bronze', 5, true
from user_achievements where achievement_key = 'first_fruit' and tier = 'gold'
on conflict do nothing;

insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_fruit', 'silver', 10, true
from user_achievements where achievement_key = 'first_fruit' and tier = 'gold'
on conflict do nothing;

-- first_growth: bronze (5pts) and silver (10pts)
insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_growth', 'bronze', 5, true
from user_achievements where achievement_key = 'first_growth' and tier = 'gold'
on conflict do nothing;

insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'first_growth', 'silver', 10, true
from user_achievements where achievement_key = 'first_growth' and tier = 'gold'
on conflict do nothing;

-- auto_cultivator: bronze (10pts) and silver (25pts)
insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'auto_cultivator', 'bronze', 10, true
from user_achievements where achievement_key = 'auto_cultivator' and tier = 'gold'
on conflict do nothing;

insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'auto_cultivator', 'silver', 25, true
from user_achievements where achievement_key = 'auto_cultivator' and tier = 'gold'
on conflict do nothing;

-- orchard_oracle: bronze (10pts) and silver (25pts)
insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'orchard_oracle', 'bronze', 10, true
from user_achievements where achievement_key = 'orchard_oracle' and tier = 'gold'
on conflict do nothing;

insert into user_achievements (user_id, achievement_key, tier, points, notified)
select user_id, 'orchard_oracle', 'silver', 25, true
from user_achievements where achievement_key = 'orchard_oracle' and tier = 'gold'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. FUNCTION: check_achievements (replaces previous version)
-- ---------------------------------------------------------------------------
-- Updated with new tiered thresholds for all achievements.

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

    -- ================================================================
    -- Getting Started achievements (now tiered)
    -- ================================================================

    -- Contact Starter (first_branch): 1/5/15 contacts
    if v_contact_count >= 15 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_branch', 'gold', 20)
        on conflict do nothing;
    end if;
    if v_contact_count >= 5 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_branch', 'silver', 10)
        on conflict do nothing;
    end if;
    if v_contact_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_branch', 'bronze', 5)
        on conflict do nothing;
    end if;

    -- Company Starter (first_root): 1/3/10 companies
    if v_company_count >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_root', 'gold', 20)
        on conflict do nothing;
    end if;
    if v_company_count >= 3 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_root', 'silver', 10)
        on conflict do nothing;
    end if;
    if v_company_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_root', 'bronze', 5)
        on conflict do nothing;
    end if;

    -- Deal Starter (first_fruit): 1/5/15 deals
    if v_deal_count >= 15 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_fruit', 'gold', 20)
        on conflict do nothing;
    end if;
    if v_deal_count >= 5 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_fruit', 'silver', 10)
        on conflict do nothing;
    end if;
    if v_deal_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_fruit', 'bronze', 5)
        on conflict do nothing;
    end if;

    -- Referral Starter (first_growth): 1/5/15 referrals
    if v_referral_count >= 15 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_growth', 'gold', 20)
        on conflict do nothing;
    end if;
    if v_referral_count >= 5 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_growth', 'silver', 10)
        on conflict do nothing;
    end if;
    if v_referral_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'first_growth', 'bronze', 5)
        on conflict do nothing;
    end if;

    -- Quick Start (seedling): onboarding completed (single gold)
    if v_onboarding_done then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'seedling', 'gold', 15)
        on conflict do nothing;
    end if;

    -- ================================================================
    -- Growth achievements (unchanged thresholds)
    -- ================================================================

    -- Network Builder (branch_collector): 10/50/100 contacts
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

    -- Company Portfolio (root_system): 5/25/100 companies
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

    -- Revenue Milestone (abundant_harvest): $1K/$10K/$100K won revenue
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

    -- Deal Closer (fruit_bearer): 5/25/100 won deals
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

    -- ================================================================
    -- Networking achievements (unchanged thresholds)
    -- ================================================================

    -- Referral Pro (growth_spreader): 10/50/100 referrals
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

    -- Conversion Expert (fruitful_growth): 1/10/25 converted referrals
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

    -- Top Performer (master_grower): 25%/50%/75% conversion rate (min 10 referrals)
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

    -- ================================================================
    -- Exchange achievements (unchanged thresholds)
    -- ================================================================

    -- Referral Sender (seed_sower): 1/10/50 sent exchanges
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

    -- Referral Receiver (seed_collector): 1/10/50 received exchanges
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

    -- Exchange Closer (cross_pollinator): 1/5/25 converted exchanges
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

    -- Trusted Partner (trusted_grower): trust rating 40/60/80
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

    -- ================================================================
    -- Engagement achievements (auto_cultivator and orchard_oracle now tiered)
    -- ================================================================

    -- Activity Tracker (growth_logger): 10/50/200 activities (unchanged)
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

    -- Automation Builder (auto_cultivator): 1/5/15 active automations
    if v_automation_count >= 15 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'auto_cultivator', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_automation_count >= 5 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'auto_cultivator', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_automation_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'auto_cultivator', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- Insight Explorer (orchard_oracle): 1/10/50 AI insights
    if v_insight_count >= 50 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'orchard_oracle', 'gold', 50)
        on conflict do nothing;
    end if;
    if v_insight_count >= 10 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'orchard_oracle', 'silver', 25)
        on conflict do nothing;
    end if;
    if v_insight_count >= 1 then
        insert into user_achievements (user_id, achievement_key, tier, points)
        values (target_user_id, 'orchard_oracle', 'bronze', 10)
        on conflict do nothing;
    end if;

    -- ================================================================
    -- Streak achievements (unchanged)
    -- ================================================================

    -- Consistency Champion (steady_grower): 7/30/90 day streak
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

    -- ================================================================
    -- Determine newly unlocked
    -- ================================================================

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
