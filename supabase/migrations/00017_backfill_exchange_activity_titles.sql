-- Backfill exchange activity titles with actual contact names
update activities
set title = concat(
  c.first_name,
  case when c.last_name is not null then ' ' || c.last_name else '' end,
  ' was received via the referral exchange'
)
from contacts c
where activities.entity_type = 'contact'
  and activities.entity_id = c.id
  and activities.activity_type = 'referral_received'
  and activities.title = 'Contact received via referral exchange';
