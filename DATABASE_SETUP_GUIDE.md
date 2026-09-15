# 📋 DATABASE SETUP - SIMPLE GUIDE

## 🎯 What You Need to Do:

### **Step 1: Run SQL in Supabase** (2 minutes)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
   ```

2. **Open this file in your project:**
   ```
   RUN_THIS_IN_SUPABASE.sql
   ```

3. **Copy ALL the content**

4. **Paste into Supabase SQL Editor**

5. **Click "Run"** ▶️

6. **Wait for success message** ✅

---

### **Step 2: Create Storage Bucket** (1 minute)

1. **Go to Supabase Storage:**
   ```
   https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/storage/buckets
   ```

2. **Click "New bucket"**

3. **Fill in:**
   - Name: `profile-pictures`
   - Public: ✅ **YES** (check this box)
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp`

4. **Click "Create bucket"**

---

### **Step 3: Test!**

Your app is already deployed on Vercel. Just test:

1. ✅ Register a student
2. ✅ Clock in (works!)
3. ✅ Try to log in from another device → BLOCKED!
4. ✅ Upload profile picture (after storage bucket created)

---

## ✅ What This Does:

### **Security (One-Device Lock):**
- ✅ Students can ONLY use the device they registered with
- ✅ Different device? BLOCKED immediately
- ✅ All failed attempts logged in `oasis_failed_attempts` table
- ✅ Device changes tracked in `oasis_device_changes` table

### **Profile Pictures:**
- ✅ Students can upload their photo
- ✅ Shows in header and dashboard
- ✅ Max 5MB, JPG/PNG/WebP
- ✅ Auto-delete old picture when uploading new one

---

## 📊 New Database Tables:

After running the SQL, you'll have:

1. **`oasis_failed_attempts`**
   - Logs every failed clock-in from wrong device
   - Shows: clock_id, device_token, IP address, reason, time

2. **`oasis_device_changes`**
   - Tracks when admin reassigns devices
   - Shows: old device, new device, who changed it, when

3. **Updated `oasis_students` table:**
   - `profile_picture_url` - URL to their photo
   - `last_device_change` - When device was last changed
   - `device_change_count` - How many times changed

---

## 🔍 Verify It Worked:

After running the SQL, you should see this success message:

```
✅ ============================================
✅ DATABASE UPDATE COMPLETE!
✅ ============================================

📊 Tables Created:
   ✓ oasis_failed_attempts (logs wrong device attempts)
   ✓ oasis_device_changes (device reassignment audit)

📝 Columns Added to oasis_students:
   ✓ profile_picture_url
   ✓ last_device_change
   ✓ device_change_count

🔒 Security Features Now Active:
   ✓ Strict one-device-per-user enforcement
   ✓ Device token validation
   ✓ Device fingerprint tracking
   ✓ IP address verification
   ✓ Failed attempt logging

📸 Profile Picture Features:
   ✓ Students can upload photos
   ✓ Max 5MB, JPG/PNG/WebP
```

---

## ⚠️ Important Notes:

- **Don't skip the storage bucket!** Profile pictures won't work without it.
- **Make sure it's PUBLIC!** Otherwise images won't display.
- **The SQL is safe to run multiple times** - it checks if things exist first.

---

## 🚀 You're Done!

After these 2 steps (SQL + Storage), your app has:
- 🔒 One-device-only enforcement
- 📸 Profile picture uploads
- 📊 Complete audit trail
- 🛡️ Multi-layer security

**Test it now on your deployed Vercel app!**
