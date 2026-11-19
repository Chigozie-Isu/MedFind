-- Storage buckets, scheduled jobs and live updates.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('medicine-photos', 'medicine-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('prescriptions', 'prescriptions', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'application/pdf']),
  ('medchat', 'medchat', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

-- Prescriptions: customers upload into their own folder; staff open only those attached to their orders.
create policy "customers upload own prescriptions" on storage.objects for insert to authenticated
  with check (bucket_id = 'prescriptions' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "customers read own prescriptions" on storage.objects for select to authenticated
  using (bucket_id = 'prescriptions' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "staff read prescriptions for their orders" on storage.objects for select to authenticated
  using (bucket_id = 'prescriptions' and exists (
    select 1 from public.prescriptions p join public.reservations r on r.prescription_id = p.id
    where p.storage_path = storage.objects.name and r.pharmacy_id in (select private.my_pharmacy_ids())));

-- MedChat attachments live under <conversation_id>/ and only the two sides can use them.
create policy "participants use medchat files" on storage.objects for all to authenticated
  using (bucket_id = 'medchat' and exists (
    select 1 from public.conversations c where c.id::text = (storage.foldername(name))[1]
      and (c.customer_id = (select auth.uid()) or c.pharmacy_id in (select private.my_pharmacy_ids()))))
  with check (bucket_id = 'medchat' and exists (
    select 1 from public.conversations c where c.id::text = (storage.foldername(name))[1]
      and (c.customer_id = (select auth.uid()) or c.pharmacy_id in (select private.my_pharmacy_ids()))));

-- Scheduled jobs.
select cron.schedule('expire-overdue-reservations', '* * * * *', $$ select public.expire_overdue_reservations() $$);
select cron.schedule('pickup-warnings', '* * * * *', $$ select public.send_pickup_warnings() $$);
-- 06:00 Lagos every Friday; generate_payouts skips the Fridays in between.
select cron.schedule('payouts', '0 5 * * 5', $$ select public.generate_payouts() $$);

-- New orders, status changes, MedChat messages and notifications arrive live in the apps.
alter publication supabase_realtime add table public.reservations, public.messages, public.notifications;
