
-- Create family_members table
create table if not exists family_members (
  id uuid default gen_random_uuid() primary key,
  master_user_id uuid references auth.users(id) not null,
  member_user_id uuid references auth.users(id) not null,
  role text check (role in ('viewer', 'editor')) default 'viewer',
  permissions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  unique(master_user_id, member_user_id)
);

-- Create invites table
create table if not exists invites (
  id uuid default gen_random_uuid() primary key,
  inviter_id uuid references auth.users(id) not null,
  email text not null,
  role text check (role in ('viewer', 'editor')) default 'viewer',
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default now()
);

-- Add created_by column to transactions (and other tables if needed)
alter table transactions add column if not exists created_by uuid references auth.users(id);

-- Update created_by for existing rows to be the owner
update transactions set created_by = user_id where created_by is null;

-- RLS Policies

-- Enable RLS
alter table family_members enable row level security;
alter table invites enable row level security;

-- Family Members Policies
create policy "Users can view their own family members"
  on family_members for select
  using (auth.uid() = master_user_id or auth.uid() = member_user_id);

create policy "Master users can manage family members"
  on family_members for all
  using (auth.uid() = master_user_id);

-- Invites Policies
create policy "Users can view invites they sent or received"
  on invites for select
  using (auth.uid() = inviter_id or email = (select email from auth.users where id = auth.uid()));

create policy "Users can create invites"
  on invites for insert
  with check (auth.uid() = inviter_id);

create policy "Users can update invites (accept/reject)"
  on invites for update
  using (auth.uid() = inviter_id or email = (select email from auth.users where id = auth.uid()));

create policy "Users can delete invites"
  on invites for delete
  using (auth.uid() = inviter_id);

-- Update Transactions RLS to allow family access
-- Note: This requires complex policies or a helper function.
-- A helper function is better for performance and reusability.

create or replace function get_family_user_ids(user_id uuid)
returns setof uuid
language sql
security definer
as $$
  select member_user_id from family_members where master_user_id = user_id
  union
  select master_user_id from family_members where member_user_id = user_id
  union
  select user_id -- include self
$$;

-- Drop existing transaction policy if it exists (or we'll create a new one allowed)
-- Assuming standard policy "Users can only access their own data" exists.
-- We need to broaden it.

-- New Policy for Transactions:
-- "Users can view transactions if they are the owner OR a family member of the owner"

-- Policy: Select
create policy "Users can view family transactions"
on transactions for select
using (
  auth.uid() = user_id -- Owner
  or exists (
    select 1 from family_members
    where master_user_id = transactions.user_id
    and member_user_id = auth.uid()
  )
);

-- Policy: Insert
-- Editors can insert into master's account
create policy "Editors can insert transactions"
on transactions for insert
with check (
  auth.uid() = user_id -- Owner
  or exists (
    select 1 from family_members
    where master_user_id = transactions.user_id
    and member_user_id = auth.uid()
    and role = 'editor'
  )
);

-- Policy: Update
create policy "Editors can update transactions"
on transactions for update
using (
  auth.uid() = user_id
  or exists (
    select 1 from family_members
    where master_user_id = transactions.user_id
    and member_user_id = auth.uid()
    and role = 'editor'
  )
);

-- Policy: Delete
create policy "Editors can delete transactions"
on transactions for delete
using (
  auth.uid() = user_id
  or exists (
    select 1 from family_members
    where master_user_id = transactions.user_id
    and member_user_id = auth.uid()
    and role = 'editor'
  )
);
