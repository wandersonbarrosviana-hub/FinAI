-- Create a secure function to check if the current user owns the email in the invite
create or replace function check_invite_access(invite_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if the current user's email matches the invite email (case insensitive)
  -- We query auth.users directly, which is allowed because this function is SECURITY DEFINER
  return exists (
    select 1 
    from auth.users 
    where id = auth.uid() 
    and lower(email) = lower(invite_email)
  );
end;
$$;

-- Update the policies to use this function
drop policy if exists "Users can view invites they sent or received" on invites;

create policy "Users can view invites they sent or received"
  on invites for select
  using (
    auth.uid() = inviter_id 
    or 
    check_invite_access(email)
  );

drop policy if exists "Users can update invites (accept/reject)" on invites;

create policy "Users can update invites (accept/reject)"
  on invites for update
  using (
    auth.uid() = inviter_id 
    or 
    check_invite_access(email)
  );
