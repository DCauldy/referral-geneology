-- Create a public bucket for user profile avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload/replace their own avatar
create policy "avatars_insert"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow anyone to read avatars (public bucket)
create policy "avatars_select"
    on storage.objects for select
    to public
    using (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatar
create policy "avatars_update"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to delete their own avatar
create policy "avatars_delete"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
