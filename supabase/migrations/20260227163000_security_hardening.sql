-- Migração para endurecimento de segurança (Hardening)
-- Aplicando search_path seguro para todas as funções RPC e view de ranking

-- 1. Endurecer View de Ranking
create or replace view global_financial_ranking
with (security_invoker = false)
as
  with monthly_scores as (
    select 
      user_id,
      total_score,
      month
    from financial_scores
    where month = to_char(current_date, 'YYYY-MM')
  )
  select 
    ms.user_id,
    ms.total_score,
    ms.month,
    p.full_name as name,
    p.avatar_url
  from monthly_scores ms
  left join profiles p on ms.user_id = p.id;

-- 2. Endurecer Funções RPC (Mitigação de injeção de esquema/search_path)
alter function reset_user_data_v2(boolean, boolean, boolean) set search_path = public, pg_temp;
alter function check_invite_access(text) set search_path = public, pg_temp;
alter function handle_new_user() set search_path = public, pg_temp;
alter function get_family_details(uuid) set search_path = public, pg_temp;
alter function reset_user_data() set search_path = public, pg_temp;
alter function get_user_by_email(text) set search_path = public, pg_temp;
alter function set_created_by() set search_path = public, pg_temp;
alter function get_family_user_ids(uuid) set search_path = public, pg_temp;
alter function get_all_users() set search_path = public, pg_temp;
