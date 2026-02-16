-- =============================================================================
-- Migration 00015: Contact Activity Filter RPC
-- =============================================================================
-- RPC function to filter contacts by their last activity date.
-- Uses existing idx_activities_entity_timeline index for performance.
-- Modes: 'active_within', 'inactive_since', 'never'
-- =============================================================================

create or replace function filter_contacts_by_activity(
    p_org_id uuid,
    p_mode   text,    -- 'active_within' | 'inactive_since' | 'never'
    p_days   int default 30
)
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if p_mode = 'active_within' then
        -- Contacts that have at least one activity within the last p_days days
        return query
        select distinct a.entity_id
        from activities a
        where a.org_id      = p_org_id
          and a.entity_type = 'contact'
          and a.created_at >= now() - (p_days || ' days')::interval;

    elsif p_mode = 'inactive_since' then
        -- Contacts whose most recent activity is older than p_days days ago
        -- (i.e. they HAVE activities, but none recent)
        return query
        select c.id
        from contacts c
        where c.org_id = p_org_id
          and exists (
              select 1 from activities a
              where a.org_id      = p_org_id
                and a.entity_type = 'contact'
                and a.entity_id   = c.id
          )
          and not exists (
              select 1 from activities a
              where a.org_id      = p_org_id
                and a.entity_type = 'contact'
                and a.entity_id   = c.id
                and a.created_at >= now() - (p_days || ' days')::interval
          );

    elsif p_mode = 'never' then
        -- Contacts with zero activities
        return query
        select c.id
        from contacts c
        where c.org_id = p_org_id
          and not exists (
              select 1 from activities a
              where a.org_id      = p_org_id
                and a.entity_type = 'contact'
                and a.entity_id   = c.id
          );

    else
        raise exception 'Invalid mode: %. Expected active_within, inactive_since, or never.', p_mode;
    end if;
end;
$$;
