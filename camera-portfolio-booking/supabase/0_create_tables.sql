-- =====================================================================
-- STEP 1 of 2: create the 4 tables (safe to re-run, never deletes data)
-- Run this FIRST in Supabase -> SQL Editor.
-- Then run 1_supabase_setup.sql (the security script).
-- =====================================================================

create table if not exists services (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  total_price     numeric not null,
  advance_amount  numeric not null,
  created_at      timestamptz not null default now()
);

create table if not exists bookings (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  client_phone    text not null,
  shoot_date      date not null,
  service_title   text not null,
  advance_paid    numeric not null,
  transaction_id  text not null,
  status          text not null default 'Pending',
  created_at      timestamptz not null default now()
);

create table if not exists portfolio (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  media_type  text not null default 'image' check (media_type in ('image', 'video')),
  media_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  client_name  text not null,
  rating       int not null check (rating between 1 and 5),
  comment      text not null,
  approved     boolean not null default false,
  created_at   timestamptz not null default now()
);
