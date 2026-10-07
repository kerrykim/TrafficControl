-- TrafficControl: cleanup 함수 수정
--
-- 원인:
-- - traffic_plans.blockdate 컬럼은 text('YYYY-MM-DD')인데 기존 함수가 date와 직접 비교해
--   "operator does not exist: text < date" 오류로 매일 실패하고 있었음
--
-- 수정:
-- - 기준일을 같은 형식의 문자열로 만들어 비교

create or replace function public.cleanup_old_traffic_plans()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.traffic_plans
  where blockdate < to_char(current_date - 30, 'YYYY-MM-DD');
end;
$$;

revoke all on function public.cleanup_old_traffic_plans() from public;
grant execute on function public.cleanup_old_traffic_plans() to service_role;

-- 매일 한국시간 새벽 3시(UTC 18시) 정리. 같은 이름으로 다시 등록하면 기존 작업을 덮어쓴다.
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-old-traffic-plans-daily',
  '0 18 * * *',
  $$select public.cleanup_old_traffic_plans();$$
);
