-- Backfill generation = 1 for contacts imported via referral exchange
update contacts
set generation = 1
from referral_exchanges re
where contacts.id = re.imported_contact_id
  and re.status = 'accepted'
  and contacts.generation is null;
