-- Function to reset all user data while keeping the account and profile
-- FIX: Corrected deletion order to respect Foreign Key constraints (e.g. Accounts deleted last)

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
  delete from notifications where user_id = current_user_id;
  delete from transactions where user_id = current_user_id; -- References accounts, cats, tags
  delete from investments where user_id = current_user_id;  -- Might reference accounts
  delete from goals where user_id = current_user_id;
  delete from budgets where user_id = current_user_id;
  delete from credit_cards where user_id = current_user_id; -- Might reference accounts
  
  -- Delete "Parent" tables last
  delete from accounts where user_id = current_user_id;
  delete from tags where user_id = current_user_id;
  delete from categories where user_id = current_user_id;
  
  -- Note: We are NOT deleting from 'invites' or 'family_members' to keep social connections.
  -- If desired, those should be added here.

end;
$$;
