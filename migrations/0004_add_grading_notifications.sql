-- Add weekly grading and notifications tables

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

alter table oasis_student_grades enable row level security;
alter table oasis_notifications enable row level security;

comment on table oasis_student_grades is 'Weekly performance grades for students';
comment on table oasis_notifications is 'Real-time clock in/out notifications for admin';
