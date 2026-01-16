-- Ensure avatars bucket exists (public)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Policies for avatars bucket
-- Public read (profile pictures)
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Allow users to manage their own avatar under <user_id>/...
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow staff/admin to manage any avatar (e.g., during onboarding)
drop policy if exists "Staff can manage avatars" on storage.objects;
create policy "Staff can manage avatars"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'avatars'
  and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
)
with check (
  bucket_id = 'avatars'
  and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
);
