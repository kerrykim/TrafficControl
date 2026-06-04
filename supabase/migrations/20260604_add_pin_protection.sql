-- TrafficControl: 4-digit PIN protection for traffic_plans updates/deletes
--
-- 목적:
-- - traffic_plans 테이블에 pin 컬럼 추가
-- - 수정/삭제 시 PIN 검증을 위한 RPC 함수 생성
-- - PIN이 null이면 누구나 수정/삭제 가능 (기존 데이터 호환성)
-- - PIN이 설정된 경우 일치해야만 수정/삭제 가능

-- 1. pin 컬럼 및 reason 컬럼 추가
alter table public.traffic_plans
  add column if not exists pin text,
  add column if not exists reason text;

-- 2. update_plan_with_pin RPC 함수
create or replace function public.update_plan_with_pin(
  p_id integer,
  p_pin text,
  p_blockdate date,
  p_reason text
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

  if v_existing_pin is not null and v_existing_pin != p_pin then
    raise exception '비밀번호가 일치하지 않습니다.';
  end if;

  return query
    update public.traffic_plans
    set blockdate = p_blockdate,
        reason = p_reason
    where id = p_id
    returning *;
end;
$$;

-- 3. delete_plan_with_pin RPC 함수
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

  if v_existing_pin is not null and v_existing_pin != p_pin then
    raise exception '비밀번호가 일치하지 않습니다.';
  end if;

  return query
    delete from public.traffic_plans
    where id = p_id
    returning *;
end;
$$;

-- 4. anon 역할에 RPC 실행 권한 부여
grant execute on function public.update_plan_with_pin(integer, text, date, text) to anon;
grant execute on function public.delete_plan_with_pin(integer, text) to anon;