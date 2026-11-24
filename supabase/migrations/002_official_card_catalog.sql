-- Public read-only card catalog. Only trusted server-side sync jobs should write rows.
create table if not exists public.card_sets (
  set_code text primary key,
  name text not null,
  release_date date,
  is_released boolean not null default true,
  sort_order integer not null default 0,
  source_updated_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.card_catalog (
  card_id text primary key,
  name text not null,
  set_code text references public.card_sets(set_code) on update cascade,
  collector_number text,
  card_type text not null default 'Card',
  domains text[] not null default '{}',
  energy_cost numeric,
  might numeric,
  rarity text,
  rules_text text not null default '',
  image_url text,
  is_preview boolean not null default false,
  source_updated_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists card_catalog_name_search_idx on public.card_catalog using gin (to_tsvector('english', name));
create index if not exists card_catalog_type_idx on public.card_catalog (card_type);
create index if not exists card_catalog_set_idx on public.card_catalog (set_code);
create index if not exists card_catalog_domains_idx on public.card_catalog using gin (domains);

alter table public.card_sets enable row level security;
alter table public.card_catalog enable row level security;

drop policy if exists "Card sets are public" on public.card_sets;
create policy "Card sets are public" on public.card_sets for select using (true);
drop policy if exists "Card catalog is public" on public.card_catalog;
create policy "Card catalog is public" on public.card_catalog for select using (true);

create trigger card_sets_updated_at before update on public.card_sets
for each row execute function public.set_updated_at();
create trigger card_catalog_updated_at before update on public.card_catalog
for each row execute function public.set_updated_at();
