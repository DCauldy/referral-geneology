-- Migration: 00011_referral_metrics
-- Automatically compute contacts.referral_score and contacts.lifetime_referral_value
-- via database triggers on the referrals and deals tables.

-- ---------------------------------------------------------------------------
-- 1. Index for efficient deal_id lookups on referrals
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_referrals_deal_id
  ON referrals (deal_id)
  WHERE deal_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Core recalculation function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_contact_referral_metrics(p_contact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score   numeric := 0;
  v_value   numeric := 0;
BEGIN
  -- referral_score: COUNT(non-declined) + 2 × COUNT(converted)
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE r.status <> 'declined'), 0)
    + 2 * COALESCE(COUNT(*) FILTER (WHERE r.status = 'converted'), 0)
  INTO v_score
  FROM referrals r
  WHERE r.referrer_id = p_contact_id;

  -- lifetime_referral_value:
  --   SUM(deals.value) for won deals linked via referrals where contact is referrer
  -- + SUM(referrals.referral_value) for converted referrals without a linked deal
  SELECT
    COALESCE(SUM(
      CASE
        WHEN r.deal_id IS NOT NULL AND d.status = 'won'
          THEN COALESCE(d.value, 0)
        WHEN r.deal_id IS NULL AND r.status = 'converted'
          THEN COALESCE(r.referral_value, 0)
        ELSE 0
      END
    ), 0)
  INTO v_value
  FROM referrals r
  LEFT JOIN deals d ON d.id = r.deal_id
  WHERE r.referrer_id = p_contact_id;

  UPDATE contacts
  SET referral_score          = v_score,
      lifetime_referral_value = v_value
  WHERE id = p_contact_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Trigger function for referrals table changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_recalc_referral_metrics_on_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_contact_referral_metrics(OLD.referrer_id);
    RETURN OLD;
  END IF;

  -- INSERT or UPDATE: always recalculate for the new referrer
  PERFORM recalculate_contact_referral_metrics(NEW.referrer_id);

  -- UPDATE where referrer_id changed: also recalculate the old referrer
  IF TG_OP = 'UPDATE' AND OLD.referrer_id IS DISTINCT FROM NEW.referrer_id THEN
    PERFORM recalculate_contact_referral_metrics(OLD.referrer_id);
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger on referrals
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_referral_metrics_on_referral
  AFTER INSERT OR UPDATE OR DELETE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION trg_recalc_referral_metrics_on_referral();

-- ---------------------------------------------------------------------------
-- 5. Trigger function for deals table changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_recalc_referral_metrics_on_deal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Early exit if neither status nor value actually changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status
     AND OLD.value IS NOT DISTINCT FROM NEW.value THEN
    RETURN NEW;
  END IF;

  -- Recalculate metrics for every referrer linked to this deal
  FOR v_referrer_id IN
    SELECT DISTINCT referrer_id
    FROM referrals
    WHERE deal_id = NEW.id
  LOOP
    PERFORM recalculate_contact_referral_metrics(v_referrer_id);
  END LOOP;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Trigger on deals (only status and value columns)
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_referral_metrics_on_deal
  AFTER UPDATE OF status, value ON deals
  FOR EACH ROW
  EXECUTE FUNCTION trg_recalc_referral_metrics_on_deal();

-- ---------------------------------------------------------------------------
-- 7. Backfill existing contacts
-- ---------------------------------------------------------------------------
WITH metrics AS (
  SELECT
    r.referrer_id,
    -- referral_score
    COUNT(*) FILTER (WHERE r.status <> 'declined')
      + 2 * COUNT(*) FILTER (WHERE r.status = 'converted')
    AS score,
    -- lifetime_referral_value
    COALESCE(SUM(
      CASE
        WHEN r.deal_id IS NOT NULL AND d.status = 'won'
          THEN COALESCE(d.value, 0)
        WHEN r.deal_id IS NULL AND r.status = 'converted'
          THEN COALESCE(r.referral_value, 0)
        ELSE 0
      END
    ), 0) AS value
  FROM referrals r
  LEFT JOIN deals d ON d.id = r.deal_id
  GROUP BY r.referrer_id
)
UPDATE contacts c
SET referral_score          = m.score,
    lifetime_referral_value = m.value
FROM metrics m
WHERE c.id = m.referrer_id;
