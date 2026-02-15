-- Fix RLS policies for invites to use JWT email instead of querying auth.users
-- This avoids permission issues where authenticated users cannot read auth.users table

drop policy if exists "Users can view invites they sent or received" on invites;

create policy "Users can view invites they sent or received"
  on invites for select
  using (
    auth.uid() = inviter_id 
    or 
    email = (auth.jwt() ->> 'email')
  );

drop policy if exists "Users can update invites (accept/reject)" on invites;

create policy "Users can update invites (accept/reject)"
  on invites for update
  using (
    auth.uid() = inviter_id 
    or 
    email = (auth.jwt() ->> 'email')
  );
