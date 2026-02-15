
-- Extend Family Sharing RLS to other tables

-- Helper function to check family access (if not already created, but we assume the previous script ran)
-- We'll just use the inline logic to be safe and self-contained or consistent.

-- ACCOUNTS
alter table accounts enable row level security;
create policy "Family can view accounts" on accounts for select using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = accounts.user_id and member_user_id = auth.uid())
);
-- Only editors can modify? Or just owner? Let's allow editors to modify accounts imply full trust.
create policy "Family editors can insert/update/delete accounts" on accounts for all using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = accounts.user_id and member_user_id = auth.uid() and role = 'editor')
);

-- GOALS
alter table goals enable row level security;
create policy "Family can view goals" on goals for select using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = goals.user_id and member_user_id = auth.uid())
);
create policy "Family editors can manage goals" on goals for all using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = goals.user_id and member_user_id = auth.uid() and role = 'editor')
);

-- BUDGETS
alter table budgets enable row level security;
create policy "Family can view budgets" on budgets for select using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = budgets.user_id and member_user_id = auth.uid())
);
create policy "Family editors can manage budgets" on budgets for all using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = budgets.user_id and member_user_id = auth.uid() and role = 'editor')
);

-- TAGS
alter table tags enable row level security;
create policy "Family can view tags" on tags for select using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = tags.user_id and member_user_id = auth.uid())
);
create policy "Family editors can manage tags" on tags for all using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = tags.user_id and member_user_id = auth.uid() and role = 'editor')
);

-- CATEGORIES (Using similar logic)
alter table categories enable row level security;
create policy "Family can view categories" on categories for select using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = categories.user_id and member_user_id = auth.uid())
);
create policy "Family editors can manage categories" on categories for all using (
  auth.uid() = user_id or exists (select 1 from family_members where master_user_id = categories.user_id and member_user_id = auth.uid() and role = 'editor')
);




