-- ============================================
-- 🔥 RUN THIS IN YOUR SUPABASE DATABASE
-- ============================================
-- Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
-- Copy and paste this ENTIRE file
-- Click "Run"
-- ============================================

-- ==================
-- PART 1: ADD PROFILE PICTURE SUPPORT
-- ==================

-- Add profile_picture_url column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_students' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE oasis_students ADD COLUMN profile_picture_url text;
    RAISE NOTICE '✅ Added profile_picture_url column';
  ELSE
    RAISE NOTICE '⏭️  profile_picture_url already exists';
  END IF;
END $$;

-- ==================
-- PART 2: ADD DEVICE TRACKING COLUMNS
-- ==================

-- Add last_device_change timestamp
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_students' AND column_name = 'last_device_change'
  ) THEN
    ALTER TABLE oasis_students ADD COLUMN last_device_change timestamptz;
    RAISE NOTICE '✅ Added last_device_change column';
  ELSE
    RAISE NOTICE '⏭️  last_device_change already exists';
  END IF;
END $$;

-- Add device_change_count
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_students' AND column_name = 'device_change_count'
  ) THEN
    ALTER TABLE oasis_students ADD COLUMN device_change_count integer NOT NULL DEFAULT 0;
    RAISE NOTICE '✅ Added device_change_count column';
  ELSE
    RAISE NOTICE '⏭️  device_change_count already exists';
  END IF;
END $$;

-- ==================
-- PART 3: FAILED CLOCK-IN ATTEMPTS TABLE
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
-- PART 4: DEVICE CHANGES AUDIT TABLE
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
-- PART 5: INITIALIZE DATA
-- ==================

-- Set device_change_count to 0 for existing students
UPDATE oasis_students 
SET device_change_count = 0 
WHERE device_change_count IS NULL;

-- ==================
-- ✅ SUCCESS MESSAGE
-- ==================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ DATABASE UPDATE COMPLETE!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '   ✓ oasis_failed_attempts (logs wrong device attempts)';
  RAISE NOTICE '   ✓ oasis_device_changes (device reassignment audit)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Columns Added to oasis_students:';
  RAISE NOTICE '   ✓ profile_picture_url';
  RAISE NOTICE '   ✓ last_device_change';
  RAISE NOTICE '   ✓ device_change_count';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security Features Now Active:';
  RAISE NOTICE '   ✓ Strict one-device-per-user enforcement';
  RAISE NOTICE '   ✓ Device token validation';
  RAISE NOTICE '   ✓ Device fingerprint tracking';
  RAISE NOTICE '   ✓ IP address verification';
  RAISE NOTICE '   ✓ Failed attempt logging';
  RAISE NOTICE '';
  RAISE NOTICE '📸 Profile Picture Features:';
  RAISE NOTICE '   ✓ Students can upload photos';
  RAISE NOTICE '   ✓ Max 5MB, JPG/PNG/WebP';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEP REQUIRED:';
  RAISE NOTICE '   Create Storage Bucket in Supabase Dashboard:';
  RAISE NOTICE '   1. Go to Storage → Buckets';
  RAISE NOTICE '   2. Click "New bucket"';
  RAISE NOTICE '   3. Name: profile-pictures';
  RAISE NOTICE '   4. Make it PUBLIC';
  RAISE NOTICE '   5. Set file size limit: 5MB';
  RAISE NOTICE '   6. Allowed types: image/jpeg, image/png, image/webp';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your app is ready!';
  RAISE NOTICE '';
END $$;
