# 🚀 Oasis Clock-In - Setup Guide

## 📋 Quick Setup (5 minutes)

### **Step 1: Database Setup**

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
   ```

2. Run `COMPLETE_DATABASE_SETUP.sql` (creates all tables)

3. Run `RUN_IN_SUPABASE.sql` (adds one-device lock + profile pictures)

4. Create admin account:
   ```sql
   DELETE FROM oasis_admins WHERE email = 'admin@oasis.com';
   
   INSERT INTO oasis_admins (id, name, email, password_hash, role, created_at)
   VALUES (
     'admin_' || floor(random() * 1000000)::text,
     'System Administrator',
     'admin@oasis.com',
     crypt('YOUR_PASSWORD_HERE', gen_salt('bf', 10)),
     'admin',
     now()
   );
   ```
   Replace `YOUR_PASSWORD_HERE` with your password.

### **Step 2: Storage Bucket**

1. Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/storage/buckets
2. Click "New bucket"
3. Name: `profile-pictures`
4. **Make it PUBLIC** ✅
5. File size limit: `5242880` (5MB)
6. Create bucket

### **Step 3: Environment Variables (Vercel)**

1. Go to Vercel → Project Settings → Environment Variables
2. Add to **all environments** (Production, Preview, Development):
   ```
   SUPABASE_URL=https://upbocqauwlpnmqfrloqr.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYm9jcWF1d2xwbm1xZnJsb3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODUzNzYsImV4cCI6MjEwNDM2MTM3Nn0.FZC4IjEqeUzLI2QWeuhAP8cFuLrXF_6U3A0sA_4GNqY
   ```

### **Step 4: Deploy**

1. Push to GitHub (Vercel auto-deploys)
2. Or click "Redeploy" in Vercel dashboard

---

## ✅ Features

- 🔒 **One-Device Lock** - Students locked to registered device
- 📸 **Profile Pictures** - Upload photos
- 📱 **PWA** - Install as native app
- 🎯 **Auto Clock-In** - QR scan → instant clock-in
- ⏳ **Admin Approval** - Review before approval
- 📊 **Weekly Grading** - Performance tracking
- 🗺️ **GPS Tracking** - Location verification
- 🔐 **IP Verification** - Network security
- 📝 **Audit Logs** - Complete activity trail

---

## 🧪 Testing

1. Register student on one device
2. Clock in successfully ✅
3. Try from different device → BLOCKED ❌
4. Upload profile picture
5. Check admin dashboard

---

## 📞 Admin Login

- URL: `your-vercel-url.com/admin`
- Email: `admin@oasis.com`
- Password: (what you set in Step 1)

---

## 🔧 Troubleshooting

**Profile pictures not uploading?**
- Check storage bucket is PUBLIC
- Verify bucket name is exactly `profile-pictures`

**Can't clock in?**
- Check device matches registration
- Verify IP address hasn't changed
- Check GPS permissions

**Device blocked?**
- Contact admin to reassign device
- Check `oasis_failed_attempts` table for details

---

## 📚 Project Structure

```
OasisClockInApp/
├── frontend/               # Main app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── routes/        # App pages
│   │   └── lib/           # Business logic
│   └── public/            # Static files
├── COMPLETE_DATABASE_SETUP.sql    # Initial database
├── RUN_IN_SUPABASE.sql           # Device lock & profiles
└── README.md                      # Project overview
```

---

## 🎯 Support

Check failed clock-ins:
```sql
SELECT * FROM oasis_failed_attempts ORDER BY attempt_time DESC LIMIT 20;
```

View device changes:
```sql
SELECT * FROM oasis_device_changes ORDER BY created_at DESC LIMIT 20;
```
