-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for attempts (syncing local progress)
create table attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  question_id text not null,
  selected_option_index integer,
  is_correct boolean,
  timestamp bigint,
  time_spent_seconds integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table attempts enable row level security;

create policy "Users can view own attempts."
  on attempts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own attempts."
  on attempts for insert
  with check ( auth.uid() = user_id );

-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table attempts;
