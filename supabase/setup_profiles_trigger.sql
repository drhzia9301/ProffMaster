-- 0. Add email column to profiles table if it doesn't exist
alter table public.profiles add column if not exists email text;

-- 1. Create a function that inserts a row into public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger to call this function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill existing users who don't have a profile
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles);

-- 4. Update existing profiles that might have null email (if they were created before this script)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
