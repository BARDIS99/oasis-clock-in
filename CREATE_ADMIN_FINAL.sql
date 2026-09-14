-- ============================================
-- CREATE ADMIN ACCOUNT WITH CORRECT SCRYPT HASH
-- Email: admin@oasis.com
-- Password: Speaker88#
-- Run in Supabase SQL Editor
-- ============================================

-- Delete the old admin with wrong hash
DELETE FROM oasis_admins WHERE email = 'admin@oasis.com';

-- Create admin with correct scrypt hash
INSERT INTO oasis_admins (id, name, email, password_hash, role, created_at)
VALUES (
  'admin_' || floor(random() * 1000000)::text,
  'System Administrator',
  'admin@oasis.com',
  'b82646ffb94250fdb314166c6e88f4ba:c2bed095ed3d1554e0c7972dd75c3faf5d360853f800622161b631e5597176f0',
  'admin',
  now()
);

-- Verify it worked
SELECT id, name, email, role, created_at 
FROM oasis_admins 
WHERE email = 'admin@oasis.com';

-- ============================================
-- ✅ NOW LOG IN WITH:
-- Email:    admin@oasis.com
-- Password: Speaker88#
-- ============================================
