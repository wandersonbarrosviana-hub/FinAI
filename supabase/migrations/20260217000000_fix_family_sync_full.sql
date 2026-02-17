-- 1. Update get_family_user_ids to be "Full Mesh" (Everyone sees Everyone)
create or replace function get_family_user_ids(current_user_id uuid)
returns setof uuid
language sql
security definer
as $$
  -- Members I added (I am Master)
  select member_user_id from family_members where master_user_id = current_user_id
  union
  -- Masters I belong to (I am Member)
  select master_user_id from family_members where member_user_id = current_user_id
  union
  -- Siblings (Other members of the same Master) - simpler approach:
  -- If I am a member, get my master, then get all members of that master.
  select fm2.member_user_id 
  from family_members fm1
  join family_members fm2 on fm1.master_user_id = fm2.master_user_id
  where fm1.member_user_id = current_user_id
  union
  -- Myself
  select current_user_id
$$;

-- 2. Drop existing restrictive policies on transactions
drop policy if exists "Users can view family transactions" on transactions;
drop policy if exists "Editors can insert transactions" on transactions;
drop policy if exists "Editors can update transactions" on transactions;
drop policy if exists "Editors can delete transactions" on transactions;
drop policy if exists "Users can view own transactions" on transactions;
drop policy if exists "Users can insert own transactions" on transactions;
drop policy if exists "Users can update own transactions" on transactions;
drop policy if exists "Users can delete own transactions" on transactions;

-- 3. Create new Full Access Policies for Transactions
create policy "Family Full Access Select"
on transactions for select
using (
  auth.uid() = user_id 
  or created_by = auth.uid()
  or user_id in (select get_family_user_ids(auth.uid()))
);

create policy "Family Full Access Insert"
on transactions for insert
with check (
  auth.uid() = user_id 
  or user_id in (select get_family_user_ids(auth.uid()))
);

create policy "Family Full Access Update"
on transactions for update
using (
  auth.uid() = user_id 
  or created_by = auth.uid()
  or user_id in (select get_family_user_ids(auth.uid()))
);

create policy "Family Full Access Delete"
on transactions for delete
using (
  auth.uid() = user_id 
  or created_by = auth.uid()
  or user_id in (select get_family_user_ids(auth.uid()))
);

-- 4. Apply same logic to Accounts, Goals, Budgets (assuming they should be shared too)
-- Accounts
drop policy if exists "Users can view own accounts" on accounts;
drop policy if exists "Users can insert own accounts" on accounts;
drop policy if exists "Users can update own accounts" on accounts;
drop policy if exists "Users can delete own accounts" on accounts;

create policy "Family Full Access Accounts Select" on accounts for select using (user_id in (select get_family_user_ids(auth.uid())));
create policy "Family Full Access Accounts Insert" on accounts for insert with check (user_id in (select get_family_user_ids(auth.uid())));
create policy "Family Full Access Accounts Update" on accounts for update using (user_id in (select get_family_user_ids(auth.uid())));
create policy "Family Full Access Accounts Delete" on accounts for delete using (user_id in (select get_family_user_ids(auth.uid())));

-- 5. Trigger to automatically set created_by
create or replace function set_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_transaction_created_by on transactions;
create trigger set_transaction_created_by
before insert on transactions
for each row
execute function set_created_by();
