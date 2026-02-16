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

  -- 1. Transactions: Always delete because they are the "data" being reset.
  -- Deleting transactions first avoids FK issues with accounts/categories/tags
  delete from transactions where user_id = current_user_id;

  -- 2. Budgets: Always delete (implied by "zerado")
  delete from budgets where user_id = current_user_id;

  -- 3. Goals: Conditional
  if not p_keep_goals then
    delete from goals where user_id = current_user_id;
  end if;

  -- 4. Accounts & Credit Cards
  -- Logic:
  -- IF keep_accounts AND keep_cards -> Delete NOTHING from accounts
  -- IF keep_accounts AND NOT keep_cards -> Delete WHERE is_credit = true
  -- IF NOT keep_accounts AND keep_cards -> Delete WHERE is_credit = false
  -- IF NOT keep_accounts AND NOT keep_cards -> Delete ALL accounts
  
  if p_keep_accounts and p_keep_credit_cards then
    -- Do nothing
    null;
  elsif p_keep_accounts and not p_keep_credit_cards then
    delete from accounts where user_id = current_user_id and is_credit = true;
  elsif not p_keep_accounts and p_keep_credit_cards then
    delete from accounts where user_id = current_user_id and is_credit = false;
  else
    delete from accounts where user_id = current_user_id;
  end if;

  -- 5. Tags: Always delete? Or keep? 
  -- User didn't specify tags in the "Keep" list (Categories, Cards, Accounts, Goals).
  -- So we delete tags to ensure "zerado".
  delete from tags where user_id = current_user_id;
  
  -- Note: Categories are client-side (localStorage), handled by frontend.
end;
$$;
