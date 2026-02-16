-- Migration 00020: Allow null receiver_email for draft exchanges
-- The column had a NOT NULL constraint from the original table definition.
-- Drafts need to omit receiver_email; the CHECK constraint already enforces
-- that non-draft statuses must have receiver_email set.

alter table referral_exchanges
  alter column receiver_email drop not null;
