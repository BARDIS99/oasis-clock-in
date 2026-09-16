# 🔧 Change Admin Email & Remove Demo Logins

## ✅ What Was Fixed:

1. ✅ **Auto-close support card after response** - Now automatically closes when you mark as "Resolved"
2. ✅ **Remove demo login info** - Already removed from code (no demo credentials shown)
3. ⚠️ **Change admin email** - Follow steps below

---

## 📧 How to Change Admin Email in Database

### **Option 1: Update Existing Admin (Recommended)**

Go to Supabase SQL Editor: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new

**Run this SQL:**

```sql
-- Update admin email and password
UPDATE oasis_admins 
SET 
  email = 'youremail@example.com',  -- ← Change this to your real email
  name = 'Your Full Name'            -- ← Change this to your real name
WHERE role = 'admin' 
  AND email = 'admin@oasis.com';

-- Verify the change
SELECT id, name, email, role, created_at 
FROM oasis_admins 
WHERE role = 'admin';
```

**Replace:**
- `youremail@example.com` → Your real email
- `Your Full Name` → Your full name

---

### **Option 2: Create New Admin & Delete Old One**

```sql
-- Delete old admin
DELETE FROM oasis_admins WHERE email = 'admin@oasis.com';

-- Create new admin with your real email
INSERT INTO oasis_admins (id, name, email, role, created_at)
VALUES (
  'admin_' || floor(random() * 1000000)::text,
  'Your Full Name',              -- ← Your real name
  'youremail@example.com',       -- ← Your real email
  'admin',
  now()
);

-- Verify
SELECT id, name, email, role, created_at 
FROM oasis_admins;
```

---

## 🔐 Change Admin Password

The password is stored in **Supabase Auth**, not in the `oasis_admins` table.

### **Step 1: Sign Up with Your New Email**

1. Go to your deployed site: https://oasis-clock-in.vercel.app/admin
2. Click **"Sign Up"** (if available) OR use Supabase dashboard

### **Step 2: Use Supabase Dashboard (Easier)**

1. Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/auth/users
2. Click **"Add user"** → **"Create new user"**
3. **Email:** `youremail@example.com` (your real email)
4. **Password:** `YourNewSecurePassword123!`
5. Click **"Create user"**
6. **Confirm email:** Toggle off "Send email confirmation" or manually confirm

### **Step 3: Update Database to Match**

After creating the auth user, update the database:

```sql
UPDATE oasis_admins 
SET email = 'youremail@example.com'
WHERE role = 'admin';
```

---

## 🎯 Quick Method (All-in-One):

### **Run this SQL in Supabase SQL Editor:**

```sql
-- 1. Update admin record
UPDATE oasis_admins 
SET 
  email = 'youremail@example.com',  -- ← CHANGE THIS
  name = 'Your Full Name'            -- ← CHANGE THIS
WHERE role = 'admin' 
  AND email = 'admin@oasis.com';

-- 2. Verify update
SELECT 
  id, 
  name, 
  email, 
  role, 
  created_at,
  '✅ Admin updated successfully!' as status
FROM oasis_admins 
WHERE role = 'admin';
```

Then manually create auth user in Supabase Auth dashboard (Step 2 above).

---

## 🧪 Test New Admin Login:

1. **Logout** from current admin session
2. **Clear browser cookies** (important!)
3. Go to: https://oasis-clock-in.vercel.app/admin
4. **Login with:**
   - Email: `youremail@example.com`
   - Password: `YourNewSecurePassword123!`
5. Should work! ✅

---

## 🔍 Troubleshooting:

### **Problem: "Email or password is incorrect"**

**Solution:** Make sure:
1. Auth user exists in Supabase Auth → Users
2. Email in `oasis_admins` table matches Auth email exactly
3. Email is confirmed (check "Email Confirmed" column in Auth)

### **Problem: "Not authorized"**

**Solution:** Check the admin record:
```sql
SELECT * FROM oasis_admins WHERE email = 'youremail@example.com';
```

Make sure `role = 'admin'` (not 'user' or 'student')

---

## 📝 Summary:

### **What to Do:**

1. ✅ **Update admin email in database** (SQL above)
2. ✅ **Create auth user in Supabase** (Auth dashboard)
3. ✅ **Test login** with new credentials
4. ✅ **Delete old admin** (optional):
   ```sql
   DELETE FROM oasis_admins WHERE email = 'admin@oasis.com';
   ```

### **What Was Already Done:**

1. ✅ Support card now auto-closes when resolved
2. ✅ No demo login credentials in code
3. ✅ Clean, professional admin interface

---

## 🎯 Recommended Admin Email Format:

Use your actual email, like:
- `admin@yourdomain.com`
- `yourname@gmail.com`
- `supervisor@oasisinterns.com`

**Avoid:**
- ❌ `admin@oasis.com` (generic)
- ❌ `test@test.com` (demo)
- ❌ `admin@example.com` (placeholder)

---

**Update your admin email now using the SQL above!** 🚀
