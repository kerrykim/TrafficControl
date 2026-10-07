-- TrafficControl: PIN 검증 우회 수정
--
-- 원인:
-- - 기존 조건 `v_pin != p_pin`은 p_pin이 null이면 결과가 null이 되어 예외가 발생하지 않음
--   → PIN 자리에 null을 보내면 검증을 통과해 누구나 수정/삭제 가능했음
--
-- 수정:
-- - null도 불일치로 처리하는 `is distinct from`으로 비교
-- - PIN이 설정되지 않은(null) 기존 데이터는 종전대로 누구나 수정/삭제 가능

create or replace function public.verify_pin(p_id integer, p_pin text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_pin text;
begin
  select pin into v_pin from public.traffic_plans where id = p_id;
  if not found then raise exception '해당 계획을 찾을 수 없습니다.'; end if;
  if v_pin is not null and v_pin is distinct from p_pin then raise exception '비밀번호가 일치하지 않습니다.'; end if;
  return true;
end; $$;

create or replace function public.delete_plan_with_pin(
  p_id integer,
  p_pin text
)
returns setof public.traffic_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_pin text;
begin
  select pin into v_existing_pin
    from public.traffic_plans
    where id = p_id;

  if not found then
    raise exception '해당 ID의 교통차단 계획이 존재하지 않습니다.';
  end if;

  if v_existing_pin is not null and v_existing_pin is distinct from p_pin then
    raise exception '비밀번호가 일치하지 않습니다.';
  end if;

  return query
    delete from public.traffic_plans
    where id = p_id
    returning *;
end;
$$;

create or replace function public.update_plan_full_with_pin(
  p_id integer, p_pin text, p_blockdate date, p_const_name text, p_direction text,
  p_ieejung text, p_chadantime text, p_chadan text,
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
  if v_pin is not null and v_pin is distinct from p_pin then raise exception '비밀번호가 일치하지 않습니다.'; end if;

  return query update public.traffic_plans set
    blockdate = p_blockdate, const_name = p_const_name, direction = p_direction,
    ieejung = p_ieejung, chadantime = p_chadantime,
    chadan = p_chadan, workers = p_workers, signcar = p_signcar, workcar = p_workcar,
    contractee = p_contractee, employee = p_employee, employeephone = p_employeephone,
    sitemanager = p_sitemanager, smcellphone = p_smcellphone,
    reason = p_reason,
    pin = coalesce(nullif(p_new_pin, ''), pin)
  where id = p_id returning *;
end; $$;

-- 프론트에서 더 이상 호출하지 않는 구버전 함수 제거 (같은 우회 문제가 있음)
drop function if exists public.update_plan_with_pin(integer, text, date, text);
drop function if exists public.update_plan_full_with_pin(
  integer, text, date, text, text, text, time, time, text,
  int, int, int, text, text, text, text, text, text, text
);
