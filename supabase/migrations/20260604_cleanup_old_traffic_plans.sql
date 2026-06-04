-- TrafficControl: backend cleanup for records older than 30 days
--
-- 목적:
-- - 프론트엔드에서 오래된 데이터 삭제를 수행하지 않도록 분리
-- - Supabase 백엔드에서 정기적으로 30일 초과 데이터를 정리
--
-- 적용 방법:
-- 1) Supabase SQL Editor 또는 migration으로 실행
-- 2) pg_cron 사용 가능 환경이면 아래 cron.schedule 구문을 사용
-- 3) cron이 불가하면 이 함수만 만들고 Supabase Scheduled Edge Function으로 호출

create extension if not exists pg_cron;

create or replace function public.cleanup_old_traffic_plans()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.traffic_plans
  where blockdate < (current_date - interval '30 days')::date;
end;
$$;

revoke all on function public.cleanup_old_traffic_plans() from public;
grant execute on function public.cleanup_old_traffic_plans() to service_role;

-- 매일 새벽 3시 정리
select cron.schedule(
  'cleanup-old-traffic-plans-daily',
  '0 3 * * *',
  $$select public.cleanup_old_traffic_plans();$$
);
