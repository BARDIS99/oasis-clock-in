-- ============================================
-- OASIS CLOCK-IN APP - GRADING & NOTIFICATIONS UPDATE
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
-- ============================================

-- Weekly Student Grades Table
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

-- Notifications Table (for admin live activity feed)
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

-- Enable RLS
alter table oasis_student_grades enable row level security;
alter table oasis_notifications enable row level security;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Grading & Notifications System Ready!';
  RAISE NOTICE '';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '1. Weekly student grading (attendance + project scores)';
  RAISE NOTICE '2. Automatic grade calculation with emojis';
  RAISE NOTICE '3. Live admin notifications when students clock in/out';
  RAISE NOTICE '4. Student dashboard shows current grade with emoji';
  RAISE NOTICE '5. Auto-refresh notifications every 10 seconds';
END $$;
