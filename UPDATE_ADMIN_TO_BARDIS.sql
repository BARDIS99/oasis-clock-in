-- ============================================
-- 🔥 UPDATE ADMIN EMAIL TO bardisabas@gmail.com
-- ============================================
-- Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
-- Copy this entire file, paste it, and click "Run"
-- ============================================

-- Step 1: Update admin record in oasis_admins table
UPDATE oasis_admins 
SET 
  email = 'bardisbas@gmail.com',
  name = 'Bardis Abas'
WHERE role = 'admin' 
  AND (email = 'admin@oasis.com' OR id LIKE 'admin_%');

-- Step 2: Verify the update
SELECT 
  id, 
  name, 
  email, 
  role, 
  created_at,
  '✅ Admin email updated to bardisbas@gmail.com' as status
FROM oasis_admins 
WHERE role = 'admin';

-- ============================================
-- 📧 NEXT STEP: CREATE AUTH USER
-- ============================================
-- After running this SQL, go to:
-- https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/auth/users
--
-- Click "Add user" → "Create new user"
-- Email: bardisbas@gmail.com
-- Password: Speaker88#
-- Auto Confirm User: YES (toggle ON)
-- Click "Create user"
-- ============================================

-- Optional: Delete old admin records (if multiple exist)
-- DELETE FROM oasis_admins WHERE email = 'admin@oasis.com' AND role = 'admin';
