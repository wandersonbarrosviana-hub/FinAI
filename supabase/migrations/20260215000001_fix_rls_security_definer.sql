-- Simplify RLS to avoid 'permission denied for table users'
-- We verify the email directly against the user's JWT token

drop policy if exists "Users can view invites they sent or received" on invites;

create policy "Users can view invites they sent or received"
  on invites for select
  using (
    auth.uid() = inviter_id 
    or 
    lower(email) = lower(auth.jwt() ->> 'email')
  );

drop policy if exists "Users can update invites (accept/reject)" on invites;

create policy "Users can update invites (accept/reject)"
  on invites for update
  using (
    auth.uid() = inviter_id 
    or 
    lower(email) = lower(auth.jwt() ->> 'email')
  );
