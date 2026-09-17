# ✅ Supabase Final Checklist

## 📋 What You Need to Do in Supabase:

---

## ✅ **1. Update Admin Email (REQUIRED)**

### **Go to Supabase SQL Editor:**
https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new

### **Run This SQL:**
```sql
-- Update admin email to bardisbas@gmail.com
UPDATE oasis_admins 
SET 
  email = 'bardisbas@gmail.com',
  name = 'Bardis Abas'
WHERE role = 'admin' 
  AND (email = 'admin@oasis.com' OR email = 'bardisabas@gmail.com' OR id LIKE 'admin_%');

-- Verify it worked
SELECT id, name, email, role, created_at
FROM oasis_admins 
WHERE role = 'admin';
```

**Expected Result:** Should show `bardisbas@gmail.com`

---

## ✅ **2. Create Auth User for Admin (REQUIRED)**

### **Go to Supabase Auth:**
https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/auth/users

### **Steps:**
1. Click **"Add user"** → **"Create new user"**
2. Fill in:
   - **Email:** `bardisbas@gmail.com` ✅ (correct spelling!)
   - **Password:** `Speaker88#`
   - **Auto Confirm User:** ✅ **Toggle ON** (important!)
3. Click **"Create user"**
4. User should appear in the list with ✅ green checkmark (confirmed)

---

## ✅ **3. Verify Storage Bucket (Already Done)**

### **Check Storage:**
https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/storage/buckets

**Should see:**
- ✅ Bucket name: `profile-pictures`
- ✅ Public: **YES**
- ✅ Status: Active

**If missing:** You already created it, so it should be there!

---

## ✅ **4. Check Storage Policies (Verify)**

### **Go to Bucket Policies:**
https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/storage/buckets/profile-pictures

**Click the bucket → "Policies" tab**

**Should have at least 1 policy:**
- Name: Something like "Allow public access" or "Public read"
- Operations: SELECT, INSERT, UPDATE
- Target roles: `public`, `authenticated`, or `service_role`

### **If no policies exist, create one:**
1. Click **"New policy"**
2. Template: **"Allow public access"**
3. Operations: ✅ SELECT, ✅ INSERT, ✅ UPDATE
4. Click **"Review"** → **"Save policy"**

---

## 🧪 **5. Test Everything Works**

### **Test 1: Check Admin Record**
```sql
-- Should return your admin
SELECT id, name, email, role 
FROM oasis_admins 
WHERE email = 'bardisbas@gmail.com';
```

**Expected:** 1 row with your admin info

### **Test 2: Check Profile Picture Column**
```sql
-- Should return column info
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'oasis_students' 
  AND column_name = 'profile_picture_url';
```

**Expected:** 1 row showing `profile_picture_url | text | YES`

### **Test 3: Check Failed Attempts Table**
```sql
-- Should exist (empty is okay)
SELECT COUNT(*) FROM oasis_failed_attempts;
```

**Expected:** Returns 0 (or more if you've had failed attempts)

### **Test 4: Check Storage Bucket**
```sql
-- Check if storage bucket exists
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'profile-pictures';
```

**Expected:** 1 row with `profile-pictures | true`

---

## 📝 **Quick Summary - What to Do:**

### **🔴 MUST DO (If Not Done):**
1. ✅ Run SQL to update admin email to `bardisbas@gmail.com`
2. ✅ Create auth user in Auth → Users (`bardisbas@gmail.com` / `Speaker88#`)
3. ✅ Make sure auth user is **Auto Confirmed** (toggle ON)

### **🟡 VERIFY (Should Already Be Done):**
1. ✅ Storage bucket `profile-pictures` exists
2. ✅ Bucket is PUBLIC
3. ✅ Storage policies allow uploads
4. ✅ Database tables have profile_picture_url column

### **🟢 OPTIONAL (For Verification):**
1. ✅ Run test queries to verify everything
2. ✅ Check storage policies
3. ✅ Test admin login

---

## 🎯 **Most Important:**

### **Did you already do these?**
- [ ] Run `UPDATE_ADMIN_TO_BARDIS.sql` in SQL Editor
- [ ] Create auth user `bardisbas@gmail.com` in Auth → Users
- [ ] Toggle "Auto Confirm User" to YES

### **If NO, do them now:**

**Step 1:** Copy SQL from `UPDATE_ADMIN_TO_BARDIS.sql`  
**Step 2:** Paste in Supabase SQL Editor → Run  
**Step 3:** Go to Auth → Users → Add user → Fill in → Create  

---

## ✅ **After Completing:**

Test admin login:
```
URL: http://localhost:8080/admin
Email: bardisbas@gmail.com
Password: Speaker88#
```

Should work! ✅

---

## 🆘 **If Login Still Doesn't Work:**

1. **Check Auth User Exists:**
   - Go to: Auth → Users
   - Look for `bardisbas@gmail.com`
   - Check "Email Confirmed" column = ✅

2. **Check Database Record:**
   ```sql
   SELECT * FROM oasis_admins WHERE email = 'bardisbas@gmail.com';
   ```
   - Should return 1 row
   - `role` should be `'admin'`

3. **Match Emails:**
   - Auth user email = `bardisbas@gmail.com`
   - Database email = `bardisbas@gmail.com`
   - **Must match exactly!**

---

**Tell me if you've already done steps 1 & 2, or if you need help with them!** 🚀
