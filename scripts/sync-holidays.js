#!/usr/bin/env node

const DATA_GO_KR_SERVICE_KEY = process.env.DATA_GO_KR_SERVICE_KEY;
const SAM_SUPABASE_URL = process.env.SAM_SUPABASE_URL;
const SAM_SUPABASE_SERVICE_ROLE_KEY = process.env.SAM_SUPABASE_SERVICE_ROLE_KEY;

if (!DATA_GO_KR_SERVICE_KEY || !SAM_SUPABASE_URL || !SAM_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables: DATA_GO_KR_SERVICE_KEY, SAM_SUPABASE_URL, SAM_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const API_BASE = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

function normalizeServiceKey(value) {
  if (!value) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatDate(locdate) {
  const text = String(locdate);
  return text.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
}

async function fetchHolidaysForYear(year) {
  const allMonths = [];

  for (let month = 1; month <= 12; month += 1) {
    const solMonth = String(month).padStart(2, '0');
    const params = new URLSearchParams({
      solYear: String(year),
      solMonth,
      numOfRows: '100',
      pageNo: '1',
      _type: 'json',
      ServiceKey: normalizeServiceKey(DATA_GO_KR_SERVICE_KEY),
    });

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API request failed for ${year}-${solMonth}: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    if (!items) continue;

    const list = Array.isArray(items) ? items : [items];
    for (const item of list) {
      if (String(item.isHoliday ?? '').toUpperCase() !== 'Y') continue;
      allMonths.push({
        holiday_date: formatDate(item.locdate),
        holiday_name: item.dateName,
        holiday_kind: item.dateKind ?? null,
        is_holiday: true,
        holiday_year: year,
        source: 'data.go.kr',
        synced_at: new Date().toISOString(),
      });
    }
  }

  return allMonths;
}

async function fetchAllHolidays() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];
  const allHolidays = [];
  const seen = new Set();

  for (const year of years) {
    console.log(`Fetching holidays for ${year}...`);
    try {
      const holidays = await fetchHolidaysForYear(year);
      for (const row of holidays) {
        if (seen.has(row.holiday_date)) continue;
        seen.add(row.holiday_date);
        allHolidays.push(row);
      }
      console.log(`  Found ${holidays.length} holiday rows for ${year}`);
    } catch (err) {
      console.error(`  Error fetching holidays for ${year}:`, err.message);
    }
  }

  return allHolidays;
}

async function syncToSupabase(holidays) {
  if (holidays.length === 0) {
    console.log('No holidays to sync.');
    return;
  }

  const res = await fetch(`${SAM_SUPABASE_URL}/rest/v1/korean_holidays`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SAM_SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SAM_SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(holidays)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert failed: ${res.status} ${body}`);
  }

  console.log(`Synced ${holidays.length} holiday rows to Supabase (idempotent upsert).`);
}

async function main() {
  console.log('Starting Korean holiday sync...');
  const holidays = await fetchAllHolidays();
  await syncToSupabase(holidays);
  console.log('Sync complete.');
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});