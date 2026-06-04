-- TrafficControl: Full edit RPC and PIN verification
-- 1. verify_pin RPC
create or replace function public.verify_pin(p_id integer, p_pin text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_pin text;
begin
  select pin into v_pin from public.traffic_plans where id = p_id;
  if not found then raise exception '해당 계획을 찾을 수 없습니다.'; end if;
  if v_pin is not null and v_pin != p_pin then raise exception '비밀번호가 일치하지 않습니다.'; end if;
  return true;
end; $$;
grant execute on function public.verify_pin(integer, text) to anon;

-- 2. update_plan_full_with_pin RPC
create or replace function public.update_plan_full_with_pin(
  p_id integer, p_pin text, p_blockdate date, p_const_name text, p_direction text,
  p_ieejung text, p_chadan_start time, p_chadan_end time, p_chadan text,
  p_workers int, p_signcar int, p_workcar int, p_contractee text,
  p_employee text, p_employeephone text, p_sitemanager text, p_smcellphone text,
  p_reason text, p_new_pin text
)
returns setof public.traffic_plans
language plpgsql security definer set search_path = public as $$
declare v_pin text;
begin
  select pin into v_pin from public.traffic_plans where id = p_id;
  if not found then raise exception '해당 계획을 찾을 수 없습니다.'; end if;
  if v_pin is not null and v_pin != p_pin then raise exception '비밀번호가 일치하지 않습니다.'; end if;
  
  return query update public.traffic_plans set
    blockdate = p_blockdate, const_name = p_const_name, direction = p_direction,
    ieejung = p_ieejung, chadan_start = p_chadan_start, chadan_end = p_chadan_end,
    chadan = p_chadan, workers = p_workers, signcar = p_signcar, workcar = p_workcar,
    contractee = p_contractee, employee = p_employee, employeephone = p_employeephone,
    sitemanager = p_sitemanager, smcellphone = p_smcellphone,
    reason = p_reason,
    pin = coalesce(nullif(p_new_pin, ''), pin)
  where id = p_id returning *;
end; $$;
grant execute on function public.update_plan_full_with_pin(integer, text, date, text, text, text, time, time, text, int, int, int, text, text, text, text, text, text, text) to anon;
