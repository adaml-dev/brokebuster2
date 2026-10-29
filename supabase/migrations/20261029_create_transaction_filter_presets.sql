-- Saved filter sets (filters, date range, sorting and column layout) for the transactions view
create table if not exists public.transaction_filter_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(trim(name)) > 0),
  config jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (user_id, name)
);

comment on table public.transaction_filter_presets is 'Zapisane zestawy filtrów widoku transakcji (filtry, daty, sortowanie, układ kolumn)';

-- Enable RLS
alter table public.transaction_filter_presets enable row level security;

-- Create policies
create policy "Users can view their own filter presets" on public.transaction_filter_presets
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can insert their own filter presets" on public.transaction_filter_presets
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users can update their own filter presets" on public.transaction_filter_presets
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can delete their own filter presets" on public.transaction_filter_presets
  for delete to authenticated using ((select auth.uid()) = user_id);
