create index if not exists deck_likes_deck_id_idx on public.deck_likes (deck_id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Read visible decks" on public.decks;
create policy "Read visible decks" on public.decks for select
using (visibility in ('public','unlisted') or owner_id = (select auth.uid()));
drop policy if exists "Create own decks" on public.decks;
create policy "Create own decks" on public.decks for insert
with check (owner_id = (select auth.uid()));
drop policy if exists "Update own decks" on public.decks;
create policy "Update own decks" on public.decks for update
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "Delete own decks" on public.decks;
create policy "Delete own decks" on public.decks for delete
using (owner_id = (select auth.uid()));

drop policy if exists "Manage own collection" on public.collection_cards;
create policy "Manage own collection" on public.collection_cards for all
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Read likes on visible decks" on public.deck_likes;
create policy "Read likes on visible decks" on public.deck_likes for select
using (
  exists (
    select 1 from public.decks d
    where d.id = deck_id
      and (d.visibility in ('public','unlisted') or d.owner_id = (select auth.uid()))
  )
);
drop policy if exists "Like as self" on public.deck_likes;
create policy "Like as self" on public.deck_likes for insert
with check (user_id = (select auth.uid()));
drop policy if exists "Unlike as self" on public.deck_likes;
create policy "Unlike as self" on public.deck_likes for delete
using (user_id = (select auth.uid()));
