-- Trigger that mirrors every new auth.users into public.profiles.
-- Lives in the auth schema, which Drizzle does not manage, so this
-- migration is applied manually via the apply-trigger script (or copy/paste
-- into Supabase SQL Editor).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
