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
