-- TrafficControl: traffic_plans 직접 수정/삭제 차단 (RLS 적용)
--
-- 원인:
-- - traffic_plans에 RLS와 쓰기 권한 정리가 없어, Supabase 기본 권한상 anon 키만으로
--   REST API(PATCH/DELETE /rest/v1/traffic_plans)를 직접 호출해 PIN 검증을 우회할 수 있었음
--
-- 수정:
-- - RLS 활성화, 기존 정책을 모두 제거한 뒤 필요한 정책만 다시 생성
--   · 조회: 누구나 가능 (pin 컬럼은 20261007_hide_pin_from_public_select.sql의 컬럼 권한으로 계속 차단)
--   · 등록: 누구나 가능하되 PIN(4자리 숫자) 필수
--   · 수정/삭제: 정책 없음 → 직접 호출 불가, PIN을 검증하는 RPC(SECURITY DEFINER)로만 가능
-- - anon/authenticated의 UPDATE/DELETE/TRUNCATE 등 권한 회수, INSERT는 등록 폼이 쓰는 컬럼만 허용
--
-- 영향:
-- - verify_pin / update_plan_full_with_pin / delete_plan_with_pin 은 함수 소유자 권한으로 실행되므로
--   RLS와 무관하게 종전처럼 동작함
-- - cleanup_old_traffic_plans(service_role, pg_cron)도 영향 없음

-- 1. RLS 활성화
alter table public.traffic_plans enable row level security;

-- 2. 대시보드 등에서 만들어졌을 수 있는 기존 정책 제거 (허용 정책이 하나라도 남으면 RLS가 무력화됨)
do $$
declare
  r record;
begin
  for r in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = 'traffic_plans'
  loop
    execute format('drop policy if exists %I on public.traffic_plans', r.policyname);
  end loop;
end;
$$;

-- 3. 필요한 정책만 생성
create policy "traffic_plans_public_select"
  on public.traffic_plans
  for select
  to anon, authenticated
  using (true);

create policy "traffic_plans_public_insert_with_pin"
  on public.traffic_plans
  for insert
  to anon, authenticated
  with check (pin ~ '^[0-9]{4}$');

-- 4. 테이블 권한 정리: 쓰기 권한 회수 후 INSERT만 컬럼 단위로 허용
revoke insert, update, delete, truncate, references, trigger
  on public.traffic_plans
  from anon, authenticated;

grant insert (
  blockdate, const_name, direction, ieejung, chadantime, chadan,
  workers, signcar, workcar, contractee, employee, employeephone,
  sitemanager, smcellphone, pin
) on public.traffic_plans to anon, authenticated;

-- 적용 후 확인:
-- select relrowsecurity from pg_class where oid = 'public.traffic_plans'::regclass;  -- true
-- select policyname, cmd, roles from pg_policies where tablename = 'traffic_plans';  -- select, insert 2건
-- select grantee, privilege_type from information_schema.role_table_grants
--  where table_name = 'traffic_plans' and grantee in ('anon','authenticated');      -- UPDATE/DELETE 없어야 함
