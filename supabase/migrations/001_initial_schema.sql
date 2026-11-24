-- Riftbound Deckbuilder: initial multi-user schema
-- Apply in the Supabase SQL editor or with Supabase migrations.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,24}$')
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Riftbound Deck',
  description text not null default '',
  format text not null default 'Unspecified',
  visibility text not null default 'private' check (visibility in ('private','unlisted','public')),
  slug text not null unique,
  decklist jsonb not null default '[]'::jsonb,
  card_count integer not null default 0 check (card_count >= 0),
  cover_card_id text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists decks_public_updated_idx on public.decks (updated_at desc) where visibility = 'public';
create index if not exists decks_owner_updated_idx on public.decks (owner_id, updated_at desc);
create index if not exists decks_tags_idx on public.decks using gin (tags);

create table if not exists public.collection_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  quantity integer not null default 1 check (quantity > 0),
  finish text not null default 'normal',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  unique (owner_id, card_id, finish)
);
create index if not exists collection_cards_owner_idx on public.collection_cards (owner_id);

create table if not exists public.deck_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists decks_updated_at on public.decks;
create trigger decks_updated_at before update on public.decks
for each row execute function public.set_updated_at();
drop trigger if exists collection_cards_updated_at on public.collection_cards;
create trigger collection_cards_updated_at before update on public.collection_cards
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.collection_cards enable row level security;
alter table public.deck_likes enable row level security;

-- Profiles are readable by visitors; only the profile owner may edit their profile.
drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles for select using (true);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Owners can manage every deck; visitors can read public and unlisted decks.
drop policy if exists "Read visible decks" on public.decks;
create policy "Read visible decks" on public.decks for select using (visibility in ('public','unlisted') or auth.uid() = owner_id);
drop policy if exists "Create own decks" on public.decks;
create policy "Create own decks" on public.decks for insert with check (auth.uid() = owner_id);
drop policy if exists "Update own decks" on public.decks;
create policy "Update own decks" on public.decks for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Delete own decks" on public.decks;
create policy "Delete own decks" on public.decks for delete using (auth.uid() = owner_id);

-- Collection inventory is private to its owner.
drop policy if exists "Manage own collection" on public.collection_cards;
create policy "Manage own collection" on public.collection_cards for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Likes are visible on public decks; users may only create/remove their own likes.
drop policy if exists "Read likes on visible decks" on public.deck_likes;
create policy "Read likes on visible decks" on public.deck_likes for select using (
  exists (select 1 from public.decks d where d.id = deck_id and (d.visibility in ('public','unlisted') or d.owner_id = auth.uid()))
);
drop policy if exists "Like as self" on public.deck_likes;
create policy "Like as self" on public.deck_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Unlike as self" on public.deck_likes;
create policy "Unlike as self" on public.deck_likes for delete using (auth.uid() = user_id);
