-- ============================================
-- 🔥 RUN THIS IN YOUR SUPABASE DATABASE
-- ============================================
-- Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
-- Copy this entire file, paste it, and click "Run"
-- ============================================

-- Add profile picture column
ALTER TABLE oasis_students 
ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Add device tracking columns
ALTER TABLE oasis_students 
ADD COLUMN IF NOT EXISTS last_device_change timestamptz;

ALTER TABLE oasis_students 
ADD COLUMN IF NOT EXISTS device_change_count integer DEFAULT 0;

-- Failed clock-in attempts table (logs wrong device attempts)
CREATE TABLE IF NOT EXISTS oasis_failed_attempts (
  id text PRIMARY KEY,
  clock_id text NOT NULL,
  device_token text NOT NULL,
  device_ip text NOT NULL,
  device_fp text,
  attempt_time timestamptz NOT NULL DEFAULT now(),
  failure_reason text NOT NULL,
  location_id text,
  user_lat double precision,
  user_lng double precision
);

CREATE INDEX IF NOT EXISTS oasis_failed_attempts_clock_id_idx 
  ON oasis_failed_attempts (clock_id, attempt_time DESC);

CREATE INDEX IF NOT EXISTS oasis_failed_attempts_time_idx 
  ON oasis_failed_attempts (attempt_time DESC);

-- Device changes audit table
CREATE TABLE IF NOT EXISTS oasis_device_changes (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES oasis_students(id) ON DELETE CASCADE,
  old_device_token text NOT NULL,
  old_device_ip text NOT NULL,
  new_device_token text NOT NULL,
  new_device_ip text NOT NULL,
  changed_by_admin text REFERENCES oasis_admins(id) ON DELETE SET NULL,
  change_reason text NOT NULL DEFAULT 'admin_reassigned',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oasis_device_changes_student_idx 
  ON oasis_device_changes (student_id, created_at DESC);

-- Initialize existing data
UPDATE oasis_students 
SET device_change_count = 0 
WHERE device_change_count IS NULL;

-- Success message
SELECT 'DATABASE UPDATED - One-device lock + profile pictures enabled!' as status;
