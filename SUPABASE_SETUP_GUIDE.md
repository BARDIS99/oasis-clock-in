# 🗄️ SUPABASE DATABASE SETUP GUIDE

## ✅ WHAT YOU NEED TO DO IN SUPABASE

You only need to run **ONE SQL FILE** in your Supabase SQL Editor!

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project: **upbocqauwlpnmqfrloqr**
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy & Paste SQL File
1. Open the file: `COMPLETE_DATABASE_SETUP.sql`
2. Copy ALL the contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Wait for Success Message
You should see:
```
✅ ============================================
✅ OASIS CLOCK-IN APP - DATABASE READY!
✅ ============================================

📊 Tables Created:
   - oasis_admins (Supervisors)
   - oasis_sessions (Login sessions)
   - oasis_locations (Work sites + GPS + Time windows)
   - oasis_students (Students + Approval status)
   - oasis_attendance (Clock in/out + GPS distance + Status)
   - oasis_student_grades (Weekly grades with emojis)
   - oasis_notifications (Clock-in notifications)
   - oasis_support_tickets (Student support care system)
   - oasis_audit (Admin action logs)
```

---

## ✅ WHAT THIS CREATES

### 9 Database Tables:

1. **oasis_admins** - Admin user accounts
2. **oasis_sessions** - Login tokens  
3. **oasis_locations** - Work sites with GPS coordinates
4. **oasis_students** - Student registrations (no email required)
5. **oasis_attendance** - Clock-in/out records with IP tracking
6. **oasis_student_grades** - Weekly performance reports
7. **oasis_notifications** - Admin notifications
8. **oasis_support_tickets** - Support care messaging system ✨ NEW!
9. **oasis_audit** - Admin action logs

### Key Features Enabled:

✅ **IP Address Tracking**
   - `clock_in_ip` column
   - `clock_out_ip` column
   
✅ **Single Clock-In Per Day**
   - Unique index on `(student_id, day)`
   - Prevents duplicate clock-ins
   
✅ **Support Care System**
   - Students can send messages about work issues
   - Admin can respond to tickets
   - Track status: Open → In Progress → Resolved

✅ **Row Level Security**
   - Disabled on all tables
   - Application handles access control via tokens

---

## 🚫 DON'T RUN THESE FILES

These files are **already included** in `COMPLETE_DATABASE_SETUP.sql`:

- ❌ `ADD_IP_TRACKING.sql` (already included)
- ❌ `FIX_RLS_POLICIES.sql` (already included)

**Only run `COMPLETE_DATABASE_SETUP.sql`!**

---

## ✅ HOW TO VERIFY IT WORKED

### Check Tables in Supabase:
1. Go to **"Table Editor"** in Supabase
2. You should see 9 tables listed:
   - oasis_admins
   - oasis_attendance
   - oasis_audit
   - oasis_locations
   - oasis_notifications
   - oasis_sessions
   - oasis_student_grades
   - oasis_students
   - oasis_support_tickets ✨

### Check Columns in oasis_attendance:
1. Click on **oasis_attendance** table
2. Verify these columns exist:
   - `id`
   - `student_id`
   - `day`
   - `clock_in_time`
   - `clock_out_time`
   - `clock_in_ip` ✅
   - `clock_out_ip` ✅
   - `distance_meters`
   - `status`
   - `location_id`

### Check oasis_support_tickets table:
1. Click on **oasis_support_tickets** table
2. Verify columns:
   - `id`
   - `student_id`
   - `subject`
   - `message`
   - `status`
   - `priority`
   - `admin_response`
   - `responded_by`
   - `responded_at`
   - `created_at`
   - `updated_at`

---

## 🔧 IF YOU ALREADY RAN SOME SQL

**No problem!** The SQL file is **idempotent** (safe to run multiple times):

- It uses `CREATE TABLE IF NOT EXISTS`
- It checks if columns exist before adding them
- It won't create duplicates or errors

**Just run `COMPLETE_DATABASE_SETUP.sql` again!**

---

## 🎯 NEXT STEPS AFTER DATABASE SETUP

1. ✅ Refresh your app: http://localhost:8080/
2. ✅ Create your first admin account at `/admin`
3. ✅ Add work locations with GPS coordinates
4. ✅ Register as a student (no email required!)
5. ✅ Test clock-in (IP address will be recorded)
6. ✅ Try clicking "💬 Support Care" button
7. ✅ Send a test ticket
8. ✅ Login as admin and respond to the ticket

---

## ❓ TROUBLESHOOTING

### Error: "relation already exists"
✅ **This is normal!** It means you already ran the SQL before. The script will skip creating that table.

### Error: "permission denied"
❌ Check that you're logged into the correct Supabase project:
   - Project URL: https://upbocqauwlpnmqfrloqr.supabase.co

### Can't create admin account
✅ Make sure you ran the full SQL file (especially the RLS disable section at the end)

### Support Care not showing
✅ Make sure the `oasis_support_tickets` table was created

---

## 📝 SUMMARY

**You only need to:**
1. Open Supabase SQL Editor
2. Run `COMPLETE_DATABASE_SETUP.sql` 
3. Done! ✅

Everything else is already configured in that one file!
