# 🔐 New Admin Login Credentials

## ✅ Your Admin Account

**Email:** `bardisabas@gmail.com`  
**Password:** `Speaker88#`

---

## 🚀 Setup Steps (Do This Now):

### **Step 1: Update Database**
1. Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/sql/new
2. Open file: `UPDATE_ADMIN_TO_BARDIS.sql`
3. Copy the entire SQL
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. Should see: ✅ "Admin email updated to bardisabas@gmail.com"

### **Step 2: Create Auth User**
1. Go to: https://supabase.com/dashboard/project/upbocqauwlpnmqfrloqr/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email:** `bardisabas@gmail.com`
   - **Password:** `Speaker88#`
   - **Auto Confirm User:** ✅ **YES** (toggle ON - important!)
4. Click **"Create user"**
5. User should appear in the list

### **Step 3: Test Login**
1. Go to: https://oasis-clock-in.vercel.app/admin
2. Or: http://localhost:8080/admin (if testing locally)
3. **Login with:**
   - Email: `bardisabas@gmail.com`
   - Password: `Speaker88#`
4. Should work! ✅

---

## 🧪 Verify It Works:

After creating the auth user, test immediately:

```
URL: https://oasis-clock-in.vercel.app/admin
Email: bardisabas@gmail.com
Password: Speaker88#
```

Expected result: ✅ Login successful → Admin dashboard

---

## 🔍 Troubleshooting:

### **Problem: "Email or password is incorrect"**

**Check Auth User Exists:**
1. Go to: Supabase → Authentication → Users
2. Look for `bardisabas@gmail.com` in the list
3. Check **"Email Confirmed"** column = ✅ (should be green checkmark)

**If not confirmed:**
- Click the user → Click **"Confirm email"** button

### **Problem: "Not authorized"**

**Check Database Record:**
```sql
SELECT * FROM oasis_admins WHERE email = 'bardisabas@gmail.com';
```

Should return:
- `role = 'admin'` ✓
- `email = 'bardisabas@gmail.com'` ✓

### **Problem: Still shows old admin@oasis.com**

**Run this SQL:**
```sql
-- Force update
UPDATE oasis_admins 
SET email = 'bardisabas@gmail.com', name = 'Bardis Abas'
WHERE role = 'admin';

-- Delete old entries
DELETE FROM oasis_admins WHERE email = 'admin@oasis.com';

-- Verify
SELECT * FROM oasis_admins WHERE role = 'admin';
```

---

## 📝 Summary:

1. ✅ Run `UPDATE_ADMIN_TO_BARDIS.sql` in Supabase SQL Editor
2. ✅ Create auth user: bardisabas@gmail.com / Speaker88# (Auto-confirm: YES)
3. ✅ Test login at /admin
4. ✅ Delete old admin@oasis.com auth user (optional)

---

## 🎯 Quick Checklist:

- [ ] SQL updated in database
- [ ] Auth user created in Supabase
- [ ] Email auto-confirmed
- [ ] Login tested successfully
- [ ] Old admin@oasis.com deleted (optional)

---

**Your new admin login is ready! Complete Step 1 & 2 above to activate it.** 🚀
