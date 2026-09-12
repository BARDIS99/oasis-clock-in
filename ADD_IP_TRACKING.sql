-- ============================================
-- ADD IP ADDRESS TRACKING TO ATTENDANCE
-- Run this if your database is already set up
-- ============================================

-- Add clock_in_ip column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_attendance' AND column_name = 'clock_in_ip'
  ) THEN
    ALTER TABLE oasis_attendance ADD COLUMN clock_in_ip text;
    RAISE NOTICE '✅ Added clock_in_ip column';
  ELSE
    RAISE NOTICE '⚠️  clock_in_ip column already exists';
  END IF;
END $$;

-- Add clock_out_ip column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'oasis_attendance' AND column_name = 'clock_out_ip'
  ) THEN
    ALTER TABLE oasis_attendance ADD COLUMN clock_out_ip text;
    RAISE NOTICE '✅ Added clock_out_ip column';
  ELSE
    RAISE NOTICE '⚠️  clock_out_ip column already exists';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ IP ADDRESS TRACKING ENABLED!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 New Columns Added:';
  RAISE NOTICE '   - oasis_attendance.clock_in_ip';
  RAISE NOTICE '   - oasis_attendance.clock_out_ip';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 What This Does:';
  RAISE NOTICE '   - Records device IP on every clock-in';
  RAISE NOTICE '   - Records device IP on every clock-out';
  RAISE NOTICE '   - Visible in admin attendance page';
  RAISE NOTICE '   - Included in CSV exports';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Refresh your app to see IP addresses!';
  RAISE NOTICE '';
END $$;
