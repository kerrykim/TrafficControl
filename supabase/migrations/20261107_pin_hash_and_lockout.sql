-- TrafficControl: PIN 해시 저장 + 5회 실패 시 10분 입력 정지
--
-- 원인:
-- - PIN을 평문(text)으로 저장해 DB/백업 유출 시 그대로 노출됨
-- - 4자리 PIN(1만 가지)을 verify_pin으로 횟수 제한 없이 대입해 볼 수 있었음
--
-- 수정:
-- 1) PIN을 bcrypt 해시로 저장
--    - 기존 평문 PIN을 해시로 일괄 변환
--    - 등록/변경 시 트리거가 4자리 숫자 형식을 검사한 뒤 해시로 바꿔 저장
--      (프론트는 종전처럼 평문 4자리를 보내면 됨)
-- 2) 계획(id)별 실패 횟수 기록, 5회 연속 실패 시 10분간 해당 계획의 PIN 입력 정지
--    - 성공하면 실패 횟수 초기화
--    - 예외를 던지면 트랜잭션이 롤백되어 실패 기록도 사라지므로,
--      PIN 오류는 예외 대신 {ok:false, message} 형태로 반환
-- 3) verify_pin / update_plan_full_with_pin / delete_plan_with_pin 반환 형식을 jsonb로 변경
--    - {ok:true} 또는 {ok:false, message:'...'}
--    - 수정/삭제 결과에 pin(해시)이 포함되어 반환되던 문제도 함께 제거
--
-- 배포 순서: 이 반환 형식을 처리하는 script.js를 먼저 배포한 뒤 이 마이그레이션을 실행
--
-- 참고:
-- - PIN이 없는(null) 기존 계획은 종전처럼 PIN 없이 수정/삭제 가능 (30일 보관 후 자동 정리)
-- - 정지는 계획 단위이므로, 공격자가 일부러 틀려서 정상 사용자를 10분간 막을 수는 있음

create extension if not exists pgcrypto with schema extensions;

-- 1. 기존 평문 PIN을 bcrypt 해시로 변환 (이미 해시인 값은 건너뜀)
update public.traffic_plans
   set pin = extensions.crypt(pin, extensions.gen_salt('bf'))
 where pin is not null
   and pin !~ '^\$2[abxy]\$';

-- 2. 등록/PIN 변경 시 형식 검사 + 해시 트리거
create or replace function public.traffic_plans_hash_pin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.pin is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.pin is not distinct from old.pin then
    return new;
  end if;

  if new.pin !~ '^[0-9]{4}$' then
    raise exception '비밀번호는 4자리 숫자여야 합니다.';
  end if;

  new.pin := extensions.crypt(new.pin, extensions.gen_salt('bf'));
  return new;
end;
$$;

drop trigger if exists traffic_plans_hash_pin on public.traffic_plans;
create trigger traffic_plans_hash_pin
  before insert or update of pin on public.traffic_plans
  for each row execute function public.traffic_plans_hash_pin();

-- RLS 등록 정책: 형식 검사는 트리거가 하고, 정책은 PIN 존재만 확인
-- (WITH CHECK는 트리거가 해시로 바꾼 뒤의 값을 검사하므로 4자리 정규식을 쓸 수 없음)
drop policy if exists "traffic_plans_public_insert_with_pin" on public.traffic_plans;
create policy "traffic_plans_public_insert_with_pin"
  on public.traffic_plans
  for insert
  to anon, authenticated
  with check (pin is not null);

-- 3. 실패 횟수 기록 테이블 (외부 접근 불가)
create table if not exists public.pin_attempts (
  plan_id      integer primary key references public.traffic_plans(id) on delete cascade,
  fail_count   integer not null default 0,
  locked_until timestamptz
);

alter table public.pin_attempts enable row level security;
revoke all on public.pin_attempts from anon, authenticated;

-- 4. 내부용 PIN 검사 함수: 통과하면 null, 실패하면 오류 메시지 반환
create or replace function public._check_plan_pin(p_id integer, p_pin text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c_max_fail   constant integer  := 5;
  c_lock_time  constant interval := interval '10 minutes';
  v_hash   text;
  v_fail   integer;
  v_locked timestamptz;
begin
  select pin into v_hash from public.traffic_plans where id = p_id;
  if not found then
    return '해당 계획을 찾을 수 없습니다.';
  end if;

  -- PIN이 없는 기존 데이터는 종전처럼 통과
  if v_hash is null then
    return null;
  end if;

  -- 같은 계획에 대한 동시 시도를 직렬화
  insert into public.pin_attempts (plan_id) values (p_id) on conflict do nothing;
  select fail_count, locked_until into v_fail, v_locked
    from public.pin_attempts where plan_id = p_id
     for update;

  if v_locked is not null and v_locked > now() then
    return format('비밀번호 %s회 오류로 입력이 정지되었습니다. %s분 후 다시 시도하세요.',
                  c_max_fail, ceil(extract(epoch from (v_locked - now())) / 60)::int);
  end if;

  if p_pin is not null and extensions.crypt(p_pin, v_hash) = v_hash then
    update public.pin_attempts set fail_count = 0, locked_until = null where plan_id = p_id;
    return null;
  end if;

  -- 실패: 정지 기간이 끝난 뒤라면 1회부터 다시 셈
  v_fail := case when v_locked is not null then 1 else v_fail + 1 end;

  if v_fail >= c_max_fail then
    update public.pin_attempts
       set fail_count = 0, locked_until = now() + c_lock_time
     where plan_id = p_id;
    return format('비밀번호가 %s회 일치하지 않아 %s분간 입력이 정지됩니다.',
                  c_max_fail, extract(epoch from c_lock_time)::int / 60);
  end if;

  update public.pin_attempts set fail_count = v_fail, locked_until = null where plan_id = p_id;
  return format('비밀번호가 일치하지 않습니다. (남은 시도 %s회)', c_max_fail - v_fail);
end;
$$;

revoke all on function public._check_plan_pin(integer, text) from public, anon, authenticated;

-- 5. 공개 RPC: 반환 형식 변경을 위해 삭제 후 재생성
drop function if exists public.verify_pin(integer, text);
drop function if exists public.delete_plan_with_pin(integer, text);
drop function if exists public.update_plan_full_with_pin(
  integer, text, date, text, text, text, text, text,
  int, int, int, text, text, text, text, text, text, text
);

create function public.verify_pin(p_id integer, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_err text;
begin
  v_err := public._check_plan_pin(p_id, p_pin);
  if v_err is not null then
    return jsonb_build_object('ok', false, 'message', v_err);
  end if;
  return jsonb_build_object('ok', true);
end; $$;

create function public.delete_plan_with_pin(p_id integer, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_err text;
begin
  v_err := public._check_plan_pin(p_id, p_pin);
  if v_err is not null then
    return jsonb_build_object('ok', false, 'message', v_err);
  end if;
  delete from public.traffic_plans where id = p_id;
  return jsonb_build_object('ok', true);
end; $$;

create function public.update_plan_full_with_pin(
  p_id integer, p_pin text, p_blockdate date, p_const_name text, p_direction text,
  p_ieejung text, p_chadantime text, p_chadan text,
  p_workers int, p_signcar int, p_workcar int, p_contractee text,
  p_employee text, p_employeephone text, p_sitemanager text, p_smcellphone text,
  p_reason text, p_new_pin text
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_err text;
begin
  v_err := public._check_plan_pin(p_id, p_pin);
  if v_err is not null then
    return jsonb_build_object('ok', false, 'message', v_err);
  end if;

  update public.traffic_plans set
    blockdate = p_blockdate, const_name = p_const_name, direction = p_direction,
    ieejung = p_ieejung, chadantime = p_chadantime,
    chadan = p_chadan, workers = p_workers, signcar = p_signcar, workcar = p_workcar,
    contractee = p_contractee, employee = p_employee, employeephone = p_employeephone,
    sitemanager = p_sitemanager, smcellphone = p_smcellphone,
    reason = p_reason,
    pin = coalesce(nullif(p_new_pin, ''), pin)   -- 새 PIN은 트리거가 형식 검사 후 해시
  where id = p_id;
  return jsonb_build_object('ok', true);
end; $$;

revoke all on function public.verify_pin(integer, text) from public;
revoke all on function public.delete_plan_with_pin(integer, text) from public;
revoke all on function public.update_plan_full_with_pin(
  integer, text, date, text, text, text, text, text,
  int, int, int, text, text, text, text, text, text, text
) from public;

grant execute on function public.verify_pin(integer, text) to anon, authenticated;
grant execute on function public.delete_plan_with_pin(integer, text) to anon, authenticated;
grant execute on function public.update_plan_full_with_pin(
  integer, text, date, text, text, text, text, text,
  int, int, int, text, text, text, text, text, text, text
) to anon, authenticated;
