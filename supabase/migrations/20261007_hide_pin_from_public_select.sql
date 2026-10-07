-- TrafficControl: pin 컬럼을 공개 조회에서 제외
--
-- 목적:
-- - anon/authenticated가 traffic_plans.pin을 읽지 못하도록 컬럼 단위로 조회 권한을 제한
-- - PIN 검증은 SECURITY DEFINER 함수(verify_pin 등) 내부에서 수행하므로 수정/삭제 기능에는 영향 없음
--
-- 주의:
-- - 프론트가 select('*')를 쓰면 권한 오류가 나므로, 컬럼을 명시한 data.js가 먼저 배포되어 있어야 함

revoke select on public.traffic_plans from anon, authenticated;

grant select (
  id, created_at, blockdate, const_name, direction, ieejung, chadantime, chadan,
  workers, signcar, workcar, contractee, employee, employeephone,
  sitemanager, smcellphone, reason
) on public.traffic_plans to anon, authenticated;
