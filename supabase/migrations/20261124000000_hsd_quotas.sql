-- Chạy bằng SQL Editor với quyền quản trị hoặc "supabase db push".
-- Không lưu ảnh, không lưu API key, chỉ đếm lượt gọi theo bucket UTC.
create table if not exists public.hsd_scan_quotas (
  bucket text not null check (bucket in ('day','minute')),
  starts_at timestamptz not null,
  counter integer not null default 0 check (counter >= 0),
  primary key (bucket, starts_at)
);
alter table public.hsd_scan_quotas enable row level security;
revoke all on table public.hsd_scan_quotas from public, anon, authenticated;

create or replace function public.consume_hsd_quota(p_daily_limit integer,p_minute_limit integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_day timestamptz;
  v_minute timestamptz;
  v_day_used integer;
  v_minute_used integer;
begin
  if p_daily_limit is null or p_minute_limit is null
     or p_daily_limit < 1 or p_minute_limit < 1
     or p_daily_limit > 100000 or p_minute_limit > 10000 then
    return 'invalid';
  end if;
  v_day := date_trunc('day',v_now at time zone 'UTC') at time zone 'UTC';
  v_minute := date_trunc('minute',v_now);

  -- Khóa giao dịch đảm bảo KHÔNG vượt giới hạn khi nhiều requests đồng thời.
  perform pg_catalog.pg_advisory_xact_lock(39510,71203);
  select counter into v_day_used from public.hsd_scan_quotas
    where bucket='day' and starts_at=v_day;
  if coalesce(v_day_used,0) >= p_daily_limit then return 'daily'; end if;
  select counter into v_minute_used from public.hsd_scan_quotas
    where bucket='minute' and starts_at=v_minute;
  if coalesce(v_minute_used,0) >= p_minute_limit then return 'minute'; end if;

  insert into public.hsd_scan_quotas(bucket,starts_at,counter)
    values ('day',v_day,1)
    on conflict (bucket,starts_at) do update
    set counter=public.hsd_scan_quotas.counter+1;
  insert into public.hsd_scan_quotas(bucket,starts_at,counter)
    values ('minute',v_minute,1)
    on conflict (bucket,starts_at) do update
    set counter=public.hsd_scan_quotas.counter+1;
  return 'ok';
end;
$$;

-- Chỉ Edge Function dùng quyền admin/service_role mới được gọi RPC.
revoke all on function public.consume_hsd_quota(integer,integer) from public;
revoke all on function public.consume_hsd_quota(integer,integer) from anon, authenticated;
grant execute on function public.consume_hsd_quota(integer,integer) to service_role;
