-- Add approval system for new student registrations
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new

-- Add approved column to oasis_students table
alter table oasis_students 
add column if not exists approved boolean not null default false;

-- Set all existing students as approved (legacy data)
update oasis_students set approved = true where approved = false;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Student Approval System Added!';
  RAISE NOTICE '';
  RAISE NOTICE 'New Feature:';
  RAISE NOTICE '- New student registrations require admin approval';
  RAISE NOTICE '- Admins can approve/reject students in the Students page';
  RAISE NOTICE '- Filter by Pending/Approved status';
  RAISE NOTICE '- All existing students automatically approved';
END $$;
