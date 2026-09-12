-- Add clock-in approval system
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new

-- Add distance_meters column to track GPS distance from location
alter table oasis_attendance 
add column if not exists distance_meters integer;

-- Update status column to support 'pending' approval state
-- Existing statuses: 'present', 'absent'
-- New status: 'pending' (awaiting admin approval)

-- Set all existing attendance records to 'present' if they have clock_in_time
update oasis_attendance 
set status = 'present' 
where clock_in_time is not null and status != 'present';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Clock-In Approval System Added!';
  RAISE NOTICE '';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '1. Students clock-ins require admin approval';
  RAISE NOTICE '2. GPS distance tracking from location site';
  RAISE NOTICE '3. Admin can approve/reject clock-ins';
  RAISE NOTICE '4. Only clock-IN notifications sent (no clock-out)';
  RAISE NOTICE '5. Students must be at location to clock in/out';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin Access:';
  RAISE NOTICE '→ Admin → Clock-In Approvals page';
END $$;
