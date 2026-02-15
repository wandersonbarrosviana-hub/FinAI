
-- Function to reset all user data while keeping the account and profile
create or replace function reset_user_data()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  -- Delete from all user-specific tables
  delete from transactions where user_id = current_user_id;
  delete from accounts where user_id = current_user_id;
  delete from goals where user_id = current_user_id;
  delete from budgets where user_id = current_user_id;
  delete from tags where user_id = current_user_id;
  delete from categories where user_id = current_user_id;
  delete from credit_cards where user_id = current_user_id;
  delete from investments where user_id = current_user_id;
  delete from notifications where user_id = current_user_id;
  -- specific recurrence transactions? already likely covered by transactions delete if cascade or simple delete

end;
$$;
