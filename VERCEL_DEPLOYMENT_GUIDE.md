# 🚀 VERCEL DEPLOYMENT GUIDE - Oasis Clock-In App

## ✅ **PRE-DEPLOYMENT CHECKLIST**

Before deploying to Vercel, ensure:
- [x] Dev server runs without errors locally (✅ **CONFIRMED**)
- [x] All features tested and working (✅ **CONFIRMED**)
- [x] Code pushed to GitHub (✅ **CONFIRMED**)
- [x] Supabase database set up (✅ **CONFIRMED**)
- [x] Environment variables ready (✅ **CONFIRMED**)

---

## 📋 **STEP-BY-STEP DEPLOYMENT**

### **STEP 1: Prepare Environment Variables**

You'll need these from Supabase:
```
SUPABASE_URL=https://upbocqauwlpnmqfrloqr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYm9jcWF1d2xwbm1xZnJsb3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODUzNzYsImV4cCI6MjEwNDM2MTM3Nn0.FZC4IjEqeUzLI2QWeuhAP8cFuLrXF_6U3A0sA_4GNqY
```

---

### **STEP 2: Go to Vercel**

1. Open: https://vercel.com/
2. Click **"Sign Up"** or **"Log In"**
3. Sign in with GitHub (recommended)

---

### **STEP 3: Import Your GitHub Repository**

1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select: **`BARDIS99/oasis-clock-in`**
4. Click **"Import"**

---

### **STEP 4: Configure Build Settings**

**IMPORTANT:** Set these correctly!

#### **Framework Preset:**
- Select: **"Other"** or **"Vite"**

#### **Root Directory:**
- Set to: **`frontend`** ⚠️ **CRITICAL!**
- Click "Edit" next to Root Directory
- Type: `frontend`
- This tells Vercel your app is in the `frontend` folder

#### **Build Command:**
- Default: `npm run build` ✅ (Keep this)
- Or override with: `npm run build`

#### **Output Directory:**
- Default: `.vercel/output` ✅ (Keep this)
- TanStack Start uses this automatically

#### **Install Command:**
- Default: `npm install` ✅ (Keep this)

#### **Node Version:**
- Vercel will auto-detect (likely 18.x or 20.x)
- If issues, set to: `20.x` in project settings

---

### **STEP 5: Add Environment Variables**

Click **"Environment Variables"** section:

Add these variables:

**Variable 1:**
- **Name:** `SUPABASE_URL`
- **Value:** `https://upbocqauwlpnmqfrloqr.supabase.co`
- **Environment:** Select all (Production, Preview, Development)

**Variable 2:**
- **Name:** `SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYm9jcWF1d2xwbm1xZnJsb3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODUzNzYsImV4cCI6MjEwNDM2MTM3Nn0.FZC4IjEqeUzLI2QWeuhAP8cFuLrXF_6U3A0sA_4GNqY`
- **Environment:** Select all (Production, Preview, Development)

---

### **STEP 6: Deploy!**

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. ✅ **Success!** Your app is live!

---

## 🌐 **YOUR LIVE APP**

After deployment, Vercel gives you:

**Production URL:**
```
https://oasis-clock-in-xxxx.vercel.app
```
(Replace `xxxx` with your actual deployment ID)

**Custom Domain (Optional):**
- You can add your own domain later in Project Settings

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **Test 1: Main Page**
Visit: `https://your-app.vercel.app/`
- Should load the sign-in page
- No errors in browser console

### **Test 2: Register Student**
1. Click "New student? Register here"
2. Fill form and submit
3. Get Clock ID
4. ✅ Should work!

### **Test 3: Sign In**
1. Enter Clock ID
2. Click "Sign In"
3. ✅ Should see main interface

### **Test 4: Dashboard & Support Care**
1. Click "💬 Support Care"
2. ✅ Should see form
3. Submit a ticket
4. ✅ Should succeed

### **Test 5: Admin Access**
Visit: `https://your-app.vercel.app/admin`
1. Create admin account
2. Sign in
3. Go to Support Care
4. ✅ Should see tickets

---

## ⚙️ **VERCEL PROJECT SETTINGS**

### **Build & Development Settings:**
```
Framework: Vite / Other
Root Directory: frontend
Build Command: npm run build
Output Directory: .vercel/output
Install Command: npm install
Node.js Version: 20.x (auto-detected)
```

### **Environment Variables:**
```
SUPABASE_URL=https://upbocqauwlpnmqfrloqr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Domains:**
- Primary: `oasis-clock-in.vercel.app` (auto-assigned)
- Custom: Add your own domain (optional)

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Build Fails**

**Error: "Cannot find module"**
- **Fix:** Ensure Root Directory is set to `frontend`
- Go to Project Settings → General → Root Directory → Edit → `frontend`

**Error: "Build timed out"**
- **Fix:** Increase build timeout in Project Settings
- Or optimize build by removing unused dependencies

**Error: "ENOENT: no such file or directory"**
- **Fix:** Check that `frontend/package.json` exists
- Ensure Root Directory is correctly set

### **Issue: Environment Variables Not Working**

**Symptoms:** 
- App loads but can't connect to Supabase
- Console error: "Invalid Supabase URL"

**Fix:**
1. Go to Project Settings → Environment Variables
2. Verify both variables are set
3. Click "Redeploy" to apply changes

### **Issue: 404 on Deployment**

**Fix:**
1. Check Root Directory is `frontend`
2. Ensure `frontend/.vercel/output` exists after build
3. Check Output Directory setting

### **Issue: App Loads But Features Don't Work**

**Check:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify Supabase tables exist
4. Check Network tab for failed requests

---

## 📊 **DEPLOYMENT CHECKLIST**

- [ ] Root Directory set to `frontend`
- [ ] Environment variables added (both)
- [ ] Build completes successfully
- [ ] Deployment URL works
- [ ] Can register student
- [ ] Can sign in
- [ ] Dashboard loads
- [ ] Support Care works
- [ ] Admin can log in
- [ ] Admin can respond to tickets

---

## 🔄 **REDEPLOYING AFTER CHANGES**

### **Automatic Deployment:**
Vercel auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel automatically:
1. Detects the push
2. Builds the app
3. Deploys to production
4. ✅ Live in 2-3 minutes!

### **Manual Deployment:**
1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments" tab
4. Click "Redeploy" on latest deployment

---

## 🎯 **PRODUCTION CHECKLIST**

Before going live:
- [ ] Test all features on production URL
- [ ] Create first admin account
- [ ] Add work locations in admin panel
- [ ] Test student registration
- [ ] Test clock-in functionality
- [ ] Test Support Care (student → admin → response)
- [ ] Verify IP tracking works
- [ ] Check database has all data
- [ ] Set up custom domain (optional)
- [ ] Share URL with users!

---

## 📱 **SHARING YOUR APP**

### **Student Access:**
```
Main URL: https://your-app.vercel.app/
Registration: https://your-app.vercel.app/register
```

### **Admin Access:**
```
Admin Portal: https://your-app.vercel.app/admin
```

### **QR Code for Easy Access:**
Generate QR codes for:
- Main URL (for students)
- Admin URL (for supervisors)
- Use any QR code generator online

---

## 💡 **PRO TIPS**

1. **Custom Domain:**
   - Add your own domain in Project Settings → Domains
   - Example: `oasis.yourcompany.com`

2. **Performance:**
   - Vercel Edge Network makes your app fast globally
   - No additional config needed!

3. **Monitoring:**
   - Check deployment logs in Vercel dashboard
   - View analytics in Vercel Analytics (optional)

4. **Security:**
   - Environment variables are encrypted
   - HTTPS enabled automatically
   - Database credentials never exposed

5. **Backups:**
   - Regular GitHub commits = automatic backups
   - Vercel keeps deployment history
   - Can rollback to previous deployments

---

## 🚀 **QUICK DEPLOYMENT SUMMARY**

```bash
# 1. Ensure code is pushed
git push origin main

# 2. Go to Vercel
https://vercel.com/new

# 3. Import: BARDIS99/oasis-clock-in
# 4. Root Directory: frontend
# 5. Add env variables:
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY
# 6. Click Deploy
# 7. Wait 2-5 minutes
# 8. ✅ DONE!
```

---

## 📞 **SUPPORT**

- **Vercel Docs:** https://vercel.com/docs
- **TanStack Start Docs:** https://tanstack.com/start
- **Supabase Docs:** https://supabase.com/docs

---

**Your app is ready to deploy! Follow the steps above and you'll be live in minutes!** 🎉
