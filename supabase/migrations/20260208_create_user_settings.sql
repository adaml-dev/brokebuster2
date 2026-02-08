-- Create user_settings table
create table user_settings (
  user_id uuid references auth.users not null primary key,
  show_dashboard1 boolean default true,
  show_dashboard2 boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table user_settings enable row level security;

-- Create policies
create policy "Users can view their own settings" on user_settings
  for select using (auth.uid() = user_id);

create policy "Users can update their own settings" on user_settings
  for update using (auth.uid() = user_id);

create policy "Users can insert their own settings" on user_settings
  for insert with check (auth.uid() = user_id);

-- Function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger handle_updated_at
  before update on user_settings
  for each row
  execute procedure public.handle_updated_at();
