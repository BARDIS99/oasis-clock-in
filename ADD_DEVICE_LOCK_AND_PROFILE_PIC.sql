-- ============================================
-- STRICT ONE-DEVICE LOCK + PROFILE PICTURES
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
-- ============================================

-- ==================
-- 1. ADD PROFILE PICTURE COLUMN
-- ==================

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_students' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE oasis_students ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- ==================
-- 2. DEVICE CHANGE TRACKING
-- ==================

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_students' AND column_name = 'last_device_change'
  ) THEN
    ALTER TABLE oasis_students ADD COLUMN last_device_change timestamptz;
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_students' AND column_name = 'device_change_count'
  ) THEN
    ALTER TABLE oasis_students ADD COLUMN device_change_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ==================
-- 3. FAILED CLOCK-IN ATTEMPTS LOG
-- ==================

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

-- ==================
-- 4. DEVICE CHANGE AUDIT LOG
-- ==================

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

-- ==================
-- 5. INITIALIZE EXISTING DATA
-- ==================

UPDATE oasis_students 
SET device_change_count = 0 
WHERE device_change_count IS NULL;

-- ==================
-- 6. CREATE STORAGE BUCKET (Manual Step Required)
-- ==================

-- ⚠️ IMPORTANT: You must manually create the storage bucket in Supabase Dashboard
-- 
-- Steps:
-- 1. Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/storage/buckets
-- 2. Click "New bucket"
-- 3. Name: profile-pictures
-- 4. Set as: Public bucket ✓
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp
-- 7. Click "Create bucket"

-- ==================
-- 7. SUCCESS MESSAGE
-- ==================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ DEVICE LOCK & PROFILE PICTURES - READY!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security Features Added:';
  RAISE NOTICE '   ✓ Strict one-device-per-user enforcement';
  RAISE NOTICE '   ✓ IP address tracking for all clock-ins';
  RAISE NOTICE '   ✓ Device fingerprint validation';
  RAISE NOTICE '   ✓ Failed attempt logging';
  RAISE NOTICE '   ✓ Device change audit trail';
  RAISE NOTICE '';
  RAISE NOTICE '📸 Profile Features Added:';
  RAISE NOTICE '   ✓ Profile picture support';
  RAISE NOTICE '   ✓ Image upload capability';
  RAISE NOTICE '';
  RAISE NOTICE '📊 New Tables:';
  RAISE NOTICE '   - oasis_failed_attempts (logs wrong device attempts)';
  RAISE NOTICE '   - oasis_device_changes (audit trail for device changes)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  MANUAL STEP REQUIRED:';
  RAISE NOTICE '   Go to Supabase Dashboard → Storage';
  RAISE NOTICE '   Create bucket: "profile-pictures" (Public, 5MB limit)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 App will now:';
  RAISE NOTICE '   • Block users trying different devices';
  RAISE NOTICE '   • Log all failed clock-in attempts';
  RAISE NOTICE '   • Track IP addresses';
  RAISE NOTICE '   • Allow profile picture uploads';
  RAISE NOTICE '';
END $$;
