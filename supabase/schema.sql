-- Run in Supabase SQL editor.

create table if not exists public.products (
  id text primary key,
  name text not null,
  base_price_cents integer not null check (base_price_cents >= 0),
  category text not null
);

create table if not exists public.lots (
  lot_id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  use_by_date date not null,
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.lots enable row level security;
alter table public.public_holidays enable row level security;

drop policy if exists "public read products" on public.products;
create policy "public read products"
on public.products for select
to anon
using (true);

drop policy if exists "public write products" on public.products;
create policy "public write products"
on public.products for all
to anon
using (true)
with check (true);

drop policy if exists "public read lots" on public.lots;
create policy "public read lots"
on public.lots for select
to anon
using (true);

drop policy if exists "public write lots" on public.lots;
create policy "public write lots"
on public.lots for all
to anon
using (true)
with check (true);

drop policy if exists "public read holidays" on public.public_holidays;
create policy "public read holidays"
on public.public_holidays for select
to anon
using (true);

drop policy if exists "public write holidays" on public.public_holidays;
create policy "public write holidays"
on public.public_holidays for all
to anon
using (true)
with check (true);
