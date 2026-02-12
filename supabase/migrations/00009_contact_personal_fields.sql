-- Add personal detail columns to contacts for CRM automations
ALTER TABLE contacts
  ADD COLUMN birthday               date,
  ADD COLUMN anniversary             date,
  ADD COLUMN spouse_partner_name     text,
  ADD COLUMN preferred_contact_method text DEFAULT 'email'
    CHECK (preferred_contact_method IN ('email','phone','text','linkedin','in_person'));

-- Month/day indexes for efficient "upcoming birthdays/anniversaries" queries
CREATE INDEX idx_contacts_birthday
  ON contacts ((extract(month FROM birthday)), (extract(day FROM birthday)));

CREATE INDEX idx_contacts_anniversary
  ON contacts ((extract(month FROM anniversary)), (extract(day FROM anniversary)));
