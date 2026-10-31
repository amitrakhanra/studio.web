-- =====================================================================
-- FrameStudio: secure setup (safe to re-run)
-- Run in Supabase -> SQL Editor.
-- BEFORE running: Authentication -> Sign In / Providers -> turn OFF
-- "Allow new users to sign up" (so only YOU can ever log in as owner).
-- Then create your owner user: Authentication -> Users -> Add user.
-- =====================================================================

-- 1. Columns & constraints -------------------------------------------
alter table reviews add column if not exists approved boolean not null default false;

update bookings set status = 'Confirmed' where status is null;
alter table bookings alter column status set default 'Pending';
alter table bookings alter column status set not null;
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled'));

alter table services drop constraint if exists services_prices_check;
alter table services add constraint services_prices_check
  check (total_price > 0 and advance_amount >= 0 and advance_amount <= total_price);

-- A cancelled booking frees its date; same UTR can never be used twice
alter table bookings drop constraint if exists bookings_shoot_date_key;
drop index if exists one_booking_per_date;
create unique index one_booking_per_date on bookings (shoot_date) where status <> 'Cancelled';
drop index if exists unique_utr;
create unique index unique_utr on bookings (transaction_id);

-- 2. Turn on Row Level Security --------------------------------------
alter table services  enable row level security;
alter table portfolio enable row level security;
alter table reviews   enable row level security;
alter table bookings  enable row level security;

-- 3. Policies ---------------------------------------------------------
-- Services & portfolio: public can read, only the logged-in owner can change
drop policy if exists "public read services" on services;
drop policy if exists "owner all services" on services;
create policy "public read services" on services for select using (true);
create policy "owner all services" on services for all to authenticated using (true) with check (true);

drop policy if exists "public read portfolio" on portfolio;
drop policy if exists "owner all portfolio" on portfolio;
create policy "public read portfolio" on portfolio for select using (true);
create policy "owner all portfolio" on portfolio for all to authenticated using (true) with check (true);

-- Reviews: public can read approved ones and post new (unapproved) ones
drop policy if exists "public read approved reviews" on reviews;
drop policy if exists "public post review" on reviews;
drop policy if exists "owner all reviews" on reviews;
create policy "public read approved reviews" on reviews for select using (approved = true);
create policy "public post review" on reviews for insert to anon, authenticated
  with check (approved = false and length(trim(client_name)) between 2 and 60
              and length(trim(comment)) between 3 and 1000);
create policy "owner all reviews" on reviews for all to authenticated using (true) with check (true);

-- Bookings: NO public access at all. Public uses the functions below.
drop policy if exists "owner all bookings" on bookings;
create policy "owner all bookings" on bookings for all to authenticated using (true) with check (true);

-- 4. Safe public functions -------------------------------------------
-- 4a. Public can see WHICH dates are taken (nothing else)
create or replace function booked_dates()
returns setof date
language sql
security definer
set search_path = public
as $$
  select shoot_date from bookings where status <> 'Cancelled' order by shoot_date
$$;

-- 4b. Public creates a booking. Price comes from the services table,
--     NOT from the browser, and status is always 'Pending'.
create or replace function create_booking(
  p_name text, p_phone text, p_date date, p_service_id uuid, p_utr text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  svc services%rowtype;
  v_utr text;
begin
  select * into svc from services where id = p_service_id;
  if not found then raise exception 'Invalid service'; end if;
  if p_date < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Shoot date cannot be in the past';
  end if;
  if length(trim(p_name)) < 2 or length(trim(p_name)) > 80 then
    raise exception 'Invalid name';
  end if;
  if p_phone !~ '^[0-9]{10}$' then raise exception 'Invalid phone number'; end if;
  -- advance > 0: a real 12-digit UTR is required. advance = 0: no payment, so make a unique placeholder.
  if svc.advance_amount > 0 then
    if p_utr !~ '^[0-9]{12}$' then raise exception 'Invalid UTR number'; end if;
    v_utr := p_utr;
  else
    v_utr := 'NOADV-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  end if;

  insert into bookings
    (client_name, client_phone, shoot_date, service_title, advance_paid, transaction_id, status)
  values
    (trim(p_name), p_phone, p_date, svc.title, svc.advance_amount, v_utr, 'Pending');
end;
$$;

revoke all on function booked_dates() from public;
revoke all on function create_booking(text, text, date, uuid, text) from public;
grant execute on function booked_dates() to anon, authenticated;
grant execute on function create_booking(text, text, date, uuid, text) to anon, authenticated;

-- 5. Storage bucket for portfolio photos/videos -----------------------
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "public read portfolio files" on storage.objects;
drop policy if exists "owner upload portfolio files" on storage.objects;
drop policy if exists "owner delete portfolio files" on storage.objects;
create policy "public read portfolio files" on storage.objects
  for select using (bucket_id = 'portfolio');
create policy "owner upload portfolio files" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio');
create policy "owner delete portfolio files" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio');
