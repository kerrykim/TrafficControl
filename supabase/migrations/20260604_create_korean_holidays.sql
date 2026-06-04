create table if not exists public.korean_holidays (
  holiday_date date primary key,
  holiday_name text not null,
  holiday_kind text,
  is_holiday boolean not null default true,
  holiday_year integer not null,
  source text not null default 'data.go.kr',
  synced_at timestamptz not null default now()
);

alter table public.korean_holidays enable row level security;

create policy "Holidays are publicly readable"
  on public.korean_holidays
  for select
  using (true);