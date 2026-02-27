-- Function to reset user data with options to preserve specific entities
-- Parameters:
-- p_keep_goals: If true, goals are preserved
-- p_keep_credit_cards: If true, accounts with is_credit=true are preserved
-- p_keep_accounts: If true, accounts with is_credit=false are preserved

create or replace function reset_user_data_v2(
  p_keep_goals boolean,
  p_keep_credit_cards boolean,
  p_keep_accounts boolean
)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  -- 1. Identify accounts that will be deleted based on user parameters
  -- This CTE/Temp logic helps manage dependencies
  create temp table accounts_to_delete as
  select id from accounts 
  where user_id = current_user_id
  and (
    (not p_keep_accounts and (is_credit is false or is_credit is null)) or
    (not p_keep_credit_cards and is_credit is true)
  );

  -- 2. Delete debts first (may reference transactions)
  delete from debts where user_id = current_user_id;

  -- 3. Delete transactions pointing to the specific accounts being deleted
  -- This handles the case where other users (family) might have transactions pointing to these accounts
  delete from transactions where account_id in (select id from accounts_to_delete);

  -- 4. Delete all remaining transactions belonging to this user
  delete from transactions where user_id = current_user_id;

  -- 5. Delete budgets and custom budgets
  delete from budgets where user_id = current_user_id;
  delete from custom_budgets where user_id = current_user_id;

  -- 6. Delete tags
  delete from tags where user_id = current_user_id;

  -- 7. Goals: Conditional delete
  if not p_keep_goals then
    delete from goals where user_id = current_user_id;
  end if;

  -- 8. Finally delete the accounts
  delete from accounts where id in (select id from accounts_to_delete);

  -- Cleanup temp table
  drop table accounts_to_delete;
end;
$$;
