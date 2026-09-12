import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const OASIS_SCHEMA_SQL = `-- Oasis Clock-In schema — run once in Supabase SQL editor
create table if not exists oasis_admins (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists oasis_sessions (
  token text primary key,
  admin_id text not null references oasis_admins(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists oasis_locations (
  id text primary key,
  name text not null,
  address text not null default '',
  lat double precision,
  lng double precision,
  start_time time,
  end_time time,
  created_at timestamptz not null default now()
);

create table if not exists oasis_students (
  id text primary key,
  name text not null,
  email text not null,
  matric text not null default '',
  clock_id text not null unique,
  device_token text not null,
  device_fp text not null default '',
  device_ip text not null default '',
  location_id text references oasis_locations(id) on delete set null,
  status text not null default 'active',
  registered_at timestamptz not null default now()
);

create index if not exists oasis_students_clock_id_idx on oasis_students (clock_id);
create index if not exists oasis_students_email_idx on oasis_students (email);

create table if not exists oasis_attendance (
  id text primary key,
  student_id text not null references oasis_students(id) on delete cascade,
  location_id text references oasis_locations(id) on delete set null,
  day date not null,
  clock_in_time timestamptz,
  clock_out_time timestamptz,
  status text not null default 'present'
);

create unique index if not exists oasis_attendance_student_day_idx
  on oasis_attendance (student_id, day);

create table if not exists oasis_audit (
  id text primary key,
  admin_id text,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists oasis_student_grades (
  id text primary key,
  student_id text not null references oasis_students(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  attendance_score integer not null default 0,
  project_score integer not null default 0,
  total_score integer not null default 0,
  grade text not null default 'F',
  emoji text not null default '😐',
  admin_comment text not null default '',
  graded_by text references oasis_admins(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists oasis_student_grades_student_week_idx
  on oasis_student_grades (student_id, week_start);

create table if not exists oasis_notifications (
  id text primary key,
  student_id text not null references oasis_students(id) on delete cascade,
  action text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists oasis_notifications_created_idx 
  on oasis_notifications (created_at desc);

alter table oasis_admins enable row level security;
alter table oasis_sessions enable row level security;
alter table oasis_locations enable row level security;
alter table oasis_students enable row level security;
alter table oasis_attendance enable row level security;
alter table oasis_audit enable row level security;
alter table oasis_student_grades enable row level security;
alter table oasis_notifications enable row level security;
`;

export function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    /schema cache|could not find the table/i.test(error.message || "")
  );
}
