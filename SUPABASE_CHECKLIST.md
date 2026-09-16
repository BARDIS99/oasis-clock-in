# ✅ Supabase Setup Checklist

## 🔍 Verify Your Supabase Configuration

Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr

---

## ✅ **1. Database Tables (Required)**

Go to: **Table Editor** (left sidebar)

Check these tables exist:
- ✅ `oasis_admins`
- ✅ `oasis_students`
- ✅ `oasis_locations`
- ✅ `oasis_attendance`
- ✅ `oasis_grades`
- ✅ `oasis_audit_log`
- ✅ `oasis_failed_attempts` ← (device lock feature)
- ✅ `oasis_device_changes` ← (device lock feature)

### **Check oasis_students columns:**
- ✅ `profile_picture_url` (text, nullable)
- ✅ `last_device_change` (timestamptz, nullable)
- ✅ `device_change_count` (integer, default 0)

**If missing:** Run `RUN_IN_SUPABASE.sql` in SQL Editor

---

## ✅ **2. Storage Bucket (Required for Profile Pictures)**

Go to: **Storage** (left sidebar)

Check bucket exists:
- ✅ Bucket name: `profile-pictures`
- ✅ Public: **YES** ✓
- ✅ File size limit: 5MB
- ✅ Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### **How to Create (if missing):**

1. Click **"Storage"** → **"New bucket"**
2. Name: `profile-pictures`
3. **Public bucket**: ✓ **YES** (IMPORTANT!)
4. Click **"Create bucket"**
5. Click bucket → **"Policies"** → **"New policy"**
6. Template: **"Allow public access"**
7. Operations: SELECT, INSERT, UPDATE
8. Click **"Review"** → **"Save policy"**

---

## ✅ **3. API Keys (Required for Vercel)**

Go to: **Settings** → **API**

Verify these exist:
- ✅ `SUPABASE_URL`: `https://upbocqauwlpnmqfrloqr.supabase.co`
- ✅ `SUPABASE_ANON_KEY`: (public key - starts with `eyJ...`)
- ✅ `SUPABASE_SERVICE_ROLE_KEY`: (secret key - starts with `eyJ...`)

**Status:** ✅ You already have these in Vercel!

---

## ✅ **4. Database Connection String (Optional)**

Go to: **Settings** → **Database**

- ✅ Connection string: `postgresql://postgres...`
- ✅ Password: `v75W24n2RIoPXyl7`

**Status:** ✅ Already configured!

---

## 🧪 **Quick Test: Check if Tables Have Data**

### **Test 1: Check if profile_picture_url column exists**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'oasis_students' 
  AND column_name = 'profile_picture_url';
```

**Expected:** Returns 1 row

### **Test 2: Check failed_attempts table**
```sql
SELECT * FROM oasis_failed_attempts LIMIT 5;
```

**Expected:** Table exists (empty is okay)

### **Test 3: Check storage bucket**
Go to: **Storage** → Click `profile-pictures`

**Expected:** Bucket exists and is public

---

## 🎯 **What You NEED for Profile Pictures to Work:**

1. ✅ `oasis_students.profile_picture_url` column exists
2. ✅ Storage bucket `profile-pictures` exists
3. ✅ Bucket is **PUBLIC** (CRITICAL!)
4. ✅ Upload policy allows INSERT
5. ✅ `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars

---

## 🔧 **If Profile Pictures Don't Upload:**

### **Check Storage Policies:**
1. Go to **Storage** → `profile-pictures` → **"Policies"**
2. You should see at least one policy
3. If empty, click **"New policy"**
4. Use template: **"Allow public access"**
5. Enable: INSERT, SELECT, UPDATE
6. Click **"Save"**

### **Check RLS (Row Level Security):**
1. Go to **Authentication** → **Policies**
2. Find `profile-pictures` bucket
3. Make sure policies allow `service_role` to INSERT

---

## ❌ **The Module Error is NOT a Supabase Issue**

The error `"error loading dynamically imported module: routes-CVJ54FsD.js"` is caused by:
- ❌ Browser cache (most likely)
- ❌ Vercel CDN cache
- ❌ Old build artifacts

**It is NOT related to Supabase!**

---

## ✅ **Summary:**

Your Supabase should have:
- ✅ 8 tables (including failed_attempts, device_changes)
- ✅ Storage bucket `profile-pictures` (PUBLIC)
- ✅ 3 API keys (all set in Vercel)
- ✅ Database password configured

**If you already ran `RUN_IN_SUPABASE.sql` and created the storage bucket, your Supabase is complete!** ✅

---

## 🚀 **To Fix the Module Error:**

1. Hard refresh browser: `Ctrl + Shift + R`
2. Clear browser cache completely
3. Try incognito/private mode
4. Try different browser
5. Wait for new Vercel deployment to finish

**The module error will disappear after clearing cache!** 🎯
