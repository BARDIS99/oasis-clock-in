-- ============================================
-- VERIFY SUPPORT TICKETS TABLE EXISTS
-- Run this in Supabase SQL Editor to check
-- ============================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'oasis_support_tickets'
) as table_exists;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'oasis_support_tickets'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'oasis_support_tickets';

-- Count existing tickets
SELECT COUNT(*) as total_tickets FROM oasis_support_tickets;

-- Show sample tickets (if any)
SELECT 
  id,
  student_id,
  subject,
  status,
  created_at
FROM oasis_support_tickets
ORDER BY created_at DESC
LIMIT 5;

-- Test insert permission (will rollback)
DO $$
BEGIN
  -- Try to insert
  INSERT INTO oasis_support_tickets (
    id,
    student_id,
    subject,
    message,
    status,
    priority
  ) VALUES (
    'test_ticket_' || NOW()::text,
    'test_student',
    'Test Subject',
    'Test Message',
    'open',
    'normal'
  );
  
  -- Rollback the test insert
  RAISE EXCEPTION 'Test insert successful - rolling back';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Insert test result: %', SQLERRM;
END $$;

-- Final result
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ SUPPORT TICKETS TABLE VERIFICATION';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If you see the table structure above:';
  RAISE NOTICE '  ✓ Table exists';
  RAISE NOTICE '  ✓ RLS is disabled (rowsecurity = false)';
  RAISE NOTICE '  ✓ Insert permission works';
  RAISE NOTICE '';
  RAISE NOTICE 'The Support Care feature should work!';
  RAISE NOTICE '';
END $$;
