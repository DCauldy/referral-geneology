-- Create a public bucket for contact photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'contact-photos',
    'contact-photos',
    true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload photos scoped to their org
create policy "contact_photos_insert"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'contact-photos'
        and (storage.foldername(name))[1] in (
            select o.id::text
            from organizations o
            join org_members om on om.org_id = o.id
            where om.user_id = auth.uid()
        )
    );

-- Allow anyone to read (bucket is public, but policy still needed for listing)
create policy "contact_photos_select"
    on storage.objects for select
    to public
    using (bucket_id = 'contact-photos');

-- Allow authenticated users to update their org's photos
create policy "contact_photos_update"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'contact-photos'
        and (storage.foldername(name))[1] in (
            select o.id::text
            from organizations o
            join org_members om on om.org_id = o.id
            where om.user_id = auth.uid()
        )
    );

-- Allow authenticated users to delete their org's photos
create policy "contact_photos_delete"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'contact-photos'
        and (storage.foldername(name))[1] in (
            select o.id::text
            from organizations o
            join org_members om on om.org_id = o.id
            where om.user_id = auth.uid()
        )
    );
