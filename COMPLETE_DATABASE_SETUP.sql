-- ============================================
-- OASIS CLOCK-IN APP - COMPLETE DATABASE SETUP
-- Run this ONCE in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
-- ============================================

-- ==================
-- 1. BASE TABLES
-- ==================

-- Admins/Supervisors
create table if not exists oasis_admins (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- Admin sessions
create table if not exists oasis_sessions (
  token text primary key,
  admin_id text not null references oasis_admins(id) on delete cascade,
  expires_at timestamptz not null
);

-- Work locations/sites
create table if not exists oasis_locations (
  id text primary key,
  name text not null,
  address text not null default '',
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- Students/Interns
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

-- Attendance records
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

-- Audit log
create table if not exists oasis_audit (
  id text primary key,
  admin_id text,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

-- ==================
-- 2. GRADING SYSTEM
-- ==================

-- Weekly student grades
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

-- ==================
-- 3. NOTIFICATIONS
-- ==================

-- Admin notifications (clock-in only)
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

-- ==================
-- 4. SUPPORT CARE SYSTEM
-- ==================

-- Support tickets (student can send messages about work issues)
create table if not exists oasis_support_tickets (
  id text primary key,
  student_id text not null references oasis_students(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open', -- open, in_progress, resolved
  priority text not null default 'normal', -- low, normal, high
  admin_response text,
  responded_by text references oasis_admins(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists oasis_support_tickets_student_idx 
  on oasis_support_tickets (student_id, created_at desc);

create index if not exists oasis_support_tickets_status_idx 
  on oasis_support_tickets (status, created_at desc);

-- ==================
-- 4. ROW LEVEL SECURITY
-- ==================

alter table oasis_student_grades enable row level security;
alter table oasis_notifications enable row level security;
alter table oasis_support_tickets enable row level security;

-- ==================
-- 5. ADD NEW COLUMNS (if they don't exist)
-- ==================

-- Add approved column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_students' AND column_name = 'approved'
  ) THEN
    ALTER TABLE oasis_students ADD COLUMN approved boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add distance_meters column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_attendance' AND column_name = 'distance_meters'
  ) THEN
    ALTER TABLE oasis_attendance ADD COLUMN distance_meters integer;
  END IF;
END $$;

-- Add start_time and end_time to locations if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_locations' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE oasis_locations ADD COLUMN start_time time;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_locations' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE oasis_locations ADD COLUMN end_time time;
  END IF;
END $$;

-- ==================
-- 6. DATA MIGRATION
-- ==================

-- Set all existing students as approved (legacy data)
UPDATE oasis_students 
SET approved = true 
WHERE approved = false OR approved IS NULL;

-- Set all existing attendance to 'present' if they have clock_in_time
UPDATE oasis_attendance 
SET status = 'present' 
WHERE clock_in_time IS NOT NULL 
  AND status != 'present' 
  AND status != 'pending';

-- ==================
-- 7. SUCCESS MESSAGE
-- ==================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ OASIS CLOCK-IN APP - DATABASE READY!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '   - oasis_admins (Supervisors)';
  RAISE NOTICE '   - oasis_sessions (Login sessions)';
  RAISE NOTICE '   - oasis_locations (Work sites + GPS + Time windows)';
  RAISE NOTICE '   - oasis_students (Students + Approval status)';
  RAISE NOTICE '   - oasis_attendance (Clock in/out + GPS distance + Status)';
  RAISE NOTICE '   - oasis_student_grades (Weekly grades with emojis)';
  RAISE NOTICE '   - oasis_notifications (Clock-in notifications)';
  RAISE NOTICE '   - oasis_support_tickets (Student support care system)';
  RAISE NOTICE '   - oasis_audit (Admin action logs)';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Features Enabled:';
  RAISE NOTICE '   ✓ Student approval system';
  RAISE NOTICE '   ✓ Clock-in approval workflow';
  RAISE NOTICE '   ✓ GPS location enforcement (100m radius)';
  RAISE NOTICE '   ✓ Time window restrictions';
  RAISE NOTICE '   ✓ Weekly grading with emojis';
  RAISE NOTICE '   ✓ Live notifications (clock-in only)';
  RAISE NOTICE '   ✓ Device binding + IP verification';
  RAISE NOTICE '   ✓ Student dashboard with weekly reports';
  RAISE NOTICE '   ✓ Support care messaging system';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '   1. Refresh your app (http://localhost:8080)';
  RAISE NOTICE '   2. Create first admin account';
  RAISE NOTICE '   3. Add locations with GPS coordinates';
  RAISE NOTICE '   4. Students can register and clock in';
  RAISE NOTICE '   5. Approve students and clock-ins from admin portal';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Admin Portal: http://localhost:8080/admin';
  RAISE NOTICE '';
END $$;
