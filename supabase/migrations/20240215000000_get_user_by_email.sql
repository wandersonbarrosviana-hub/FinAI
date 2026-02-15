-- Create a function to lookup user details by email
-- This function is SECURITY DEFINER to access auth.users, but returns limited public info
create or replace function public.get_user_by_email(email_input text)
returns table (
  id uuid,
  email varchar,
  name text,
  avatar_url text
) 
security definer
as $$
begin
  return query
  select 
    au.id,
    au.email::varchar,
    (au.raw_user_meta_data->>'name')::text as name,
    (au.raw_user_meta_data->>'avatar_url')::text as avatar_url
  from auth.users au
  where lower(au.email) = lower(email_input);
end;
$$ language plpgsql;
