-- Function to reset all user data while keeping the account and profile
-- FIX: Corrected deletion order to respect Foreign Key constraints (e.g. Accounts deleted last)
-- Removed tables that do not exist or are not used: notifications, investments, categories, credit_cards

create or replace function reset_user_data()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  -- Delete from all user-specific tables (Children first)
  -- 'transactions' references 'accounts'
  delete from transactions where user_id = current_user_id;
  
  -- 'goals' and 'budgets' are standalone or reference user
  delete from goals where user_id = current_user_id;
  delete from budgets where user_id = current_user_id;
  
  -- Delete "Parent" tables last
  delete from accounts where user_id = current_user_id;
  delete from tags where user_id = current_user_id;
  
  -- Note: Categories are in localStorage, Investments are static/local.
  -- Invites and family_members are preserved.

end;
$$;
