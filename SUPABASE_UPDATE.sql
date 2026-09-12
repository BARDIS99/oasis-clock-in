-- ============================================
-- OASIS CLOCK-IN APP - DATABASE UPDATE
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
-- ============================================

-- Add time window columns to locations table
ALTER TABLE oasis_locations 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add helpful comments
COMMENT ON COLUMN oasis_locations.start_time IS 'Clock-in allowed from this time (optional)';
COMMENT ON COLUMN oasis_locations.end_time IS 'Clock-out allowed until this time (optional)';

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New features enabled:';
  RAISE NOTICE '1. Time windows for locations (admin can set start/end times)';
  RAISE NOTICE '2. GPS location verification (100m radius)';
  RAISE NOTICE '3. Device IP verification';
  RAISE NOTICE '4. QR code scanner for students';
  RAISE NOTICE '5. Forgot Clock ID recovery';
  RAISE NOTICE '6. Password visibility toggle for admin';
END $$;
