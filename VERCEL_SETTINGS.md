# ⚙️ EXACT VERCEL SETTINGS TO FIX 404

## 🎯 THE PROBLEM

**Error:** `404: NOT_FOUND`

**Root Cause:** Vercel is looking for build output in the wrong location because it doesn't know your app is in the `frontend/` subdirectory.

---

## ✅ THE FIX - COPY THESE EXACT SETTINGS

### **In Vercel Dashboard → Project Settings → General**

#### **Framework Preset:**
```
Vite
```

#### **Root Directory:**
```
frontend
```
⚠️ **THIS IS THE KEY!** Type exactly: `frontend` (no slashes, no paths)

#### **Build & Development Settings:**

Click "Override" and set these:

**Build Command:**
```
npm run build
```

**Output Directory:**
```
.vercel/output
```

**Install Command:**
```
npm install
```

**Node.js Version:**
```
20.x
```
(or leave as auto-detect)

---

## 📸 VISUAL GUIDE

```
┌─────────────────────────────────────────────┐
│ Project Settings                            │
├─────────────────────────────────────────────┤
│                                             │
│ Framework Preset                            │
│ [Vite                           ▼]          │
│                                             │
│ Root Directory                              │
│ [frontend                       ] [Edit]    │ ← CRITICAL!
│                                             │
│ Build & Development Settings                │
│                                             │
│ Build Command                  [Override]   │
│ [npm run build                  ]           │
│                                             │
│ Output Directory               [Override]   │
│ [.vercel/output                 ]           │
│                                             │
│ Install Command                [Override]   │
│ [npm install                    ]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔄 HOW TO APPLY THE FIX

### **Method 1: During Fresh Import (Best)**

When importing from GitHub:
1. Import repository: `BARDIS99/oasis-clock-in`
2. **BEFORE DEPLOYING**, scroll down
3. Find "Root Directory"
4. Click "Edit"
5. Type: `frontend`
6. Add environment variables
7. Click "Deploy"

### **Method 2: Fix Existing Project**

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click "Settings" tab
4. Find "Root Directory"
5. Click "Edit"
6. Type: `frontend`
7. Click "Save"
8. Go to "Deployments" tab
9. Click "Redeploy"

---

## 🧪 HOW TO VERIFY IT WORKED

### **In Build Logs, you should see:**
```
✓ Installing dependencies...
✓ Building...
  Running "npm run build"
  
  VITE v8.3.0  ready in 15117 ms
  ✓ 542 modules transformed
  ✓ built in 28.5s
  
✓ Build completed
✓ Uploading outputs from ".vercel/output"
✓ Deployment successful
```

### **Your app URL should load:**
- No 404 error
- Oasis Clock-In sign-in page appears
- Console has no major errors

---

## ⚠️ COMMON MISTAKES TO AVOID

❌ **WRONG:**
```
Root Directory: /frontend
Root Directory: ./frontend  
Root Directory: /home/speaker/Desktop/OasisClockInApp/frontend
Root Directory: (empty)
```

✅ **CORRECT:**
```
Root Directory: frontend
```

---

## 📋 SETTINGS CHECKLIST

Copy this and check each item:

- [ ] Framework: Vite
- [ ] Root Directory: `frontend` (exactly)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.vercel/output`
- [ ] Install Command: `npm install`
- [ ] Environment Variables added (SUPABASE_URL and SUPABASE_ANON_KEY)
- [ ] Click Save
- [ ] Redeploy

---

## 🎯 QUICK COPY-PASTE

**For Vercel Dashboard:**
```
Framework: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: .vercel/output
Install Command: npm install
```

---

## 💡 WHY THIS FIXES THE 404

**Before (404 error):**
```
Vercel looks in:
OasisClockInApp/
└── (no package.json found) ❌
└── (no build output) ❌
```

**After (Working):**
```
Vercel looks in:
OasisClockInApp/frontend/
├── package.json ✓
├── src/ ✓
└── .vercel/output/ (after build) ✓
```

By setting "Root Directory" to `frontend`, Vercel knows to run all commands inside that folder!

---

**Follow these settings exactly and your deployment will succeed!** 🚀
