-- Function to get detailed family member information
create or replace function get_family_details(current_user_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  name text,
  avatar_url text,
  role text,
  is_master boolean -- true if the returned user is the master, false if member
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  -- 1. Get members where I am the master
  select 
    fm.id as member_id,
    u.id as user_id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'name', 'Usuário')::text as name,
    coalesce(u.raw_user_meta_data->>'avatar_url', '')::text as avatar_url,
    fm.role,
    false as is_master
  from family_members fm
  join auth.users u on u.id = fm.member_user_id
  where fm.master_user_id = current_user_id
  
  union all
  
  -- 2. Get the master where I am a member
  select 
    fm.id as member_id,
    u.id as user_id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'name', 'Usuário')::text as name,
    coalesce(u.raw_user_meta_data->>'avatar_url', '')::text as avatar_url,
    'owner' as role,
    true as is_master
  from family_members fm
  join auth.users u on u.id = fm.master_user_id
  where fm.member_user_id = current_user_id;
end;
$$;
