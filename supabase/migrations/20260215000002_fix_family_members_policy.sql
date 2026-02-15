-- Allow users to join a family (insert themselves as member)
create policy "Users can join families (insert as member)"
  on family_members for insert
  with check (
    auth.uid() = member_user_id
  );
