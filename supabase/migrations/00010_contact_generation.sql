-- Migration: Add generation column to contacts
-- Gen 1 = contacts with no inbound referrals (added directly)
-- Gen N = referred by a Gen N-1 contact (minimum path)

-- 1. Add column
ALTER TABLE contacts ADD COLUMN generation INT;

-- 2. Index for filtering by generation within an org
CREATE INDEX idx_contacts_org_generation ON contacts (org_id, generation);

-- 3. Backfill existing contacts using a recursive CTE
-- Unreferred contacts get Gen 1, referred contacts get referrer's gen + 1
WITH RECURSIVE referred_ids AS (
  SELECT DISTINCT referred_id FROM referrals
),
gen_calc AS (
  -- Base case: contacts with no inbound referrals => Gen 1
  SELECT c.id, c.org_id, 1 AS generation
  FROM contacts c
  WHERE c.id NOT IN (SELECT referred_id FROM referred_ids)

  UNION ALL

  -- Recursive case: referred contacts get referrer's generation + 1
  SELECT r.referred_id AS id, r.org_id, g.generation + 1 AS generation
  FROM referrals r
  JOIN gen_calc g ON g.id = r.referrer_id AND g.org_id = r.org_id
),
-- Take minimum generation per contact (shortest path)
min_gen AS (
  SELECT id, MIN(generation) AS generation
  FROM gen_calc
  GROUP BY id
)
UPDATE contacts
SET generation = min_gen.generation
FROM min_gen
WHERE contacts.id = min_gen.id;

-- Set any remaining NULL contacts (no referral edges at all) to Gen 1
UPDATE contacts SET generation = 1 WHERE generation IS NULL;

-- 4. Utility function for manual recomputation
CREATE OR REPLACE FUNCTION recalculate_generations(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH RECURSIVE referred_ids AS (
    SELECT DISTINCT referred_id FROM referrals WHERE org_id = p_org_id
  ),
  gen_calc AS (
    SELECT c.id, 1 AS generation
    FROM contacts c
    WHERE c.org_id = p_org_id
      AND c.id NOT IN (SELECT referred_id FROM referred_ids)

    UNION ALL

    SELECT r.referred_id AS id, g.generation + 1 AS generation
    FROM referrals r
    JOIN gen_calc g ON g.id = r.referrer_id
    WHERE r.org_id = p_org_id
  ),
  min_gen AS (
    SELECT id, MIN(generation) AS generation
    FROM gen_calc
    GROUP BY id
  )
  UPDATE contacts
  SET generation = COALESCE(mg.generation, 1)
  FROM (
    SELECT c.id, mg.generation
    FROM contacts c
    LEFT JOIN min_gen mg ON mg.id = c.id
    WHERE c.org_id = p_org_id
  ) AS mg
  WHERE contacts.id = mg.id
    AND contacts.org_id = p_org_id;
END;
$$;
