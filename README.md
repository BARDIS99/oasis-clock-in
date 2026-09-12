# Oasis Clock-In

QR and Clock ID attendance for Sandlip Oasis SIWES interns. Each Clock ID is bound to one device.

## 📁 Project Structure

```
OasisClockInApp/
├── frontend/             # React frontend (TanStack Start)
│   ├── src/             # Source code
│   │   ├── routes/      # Pages (admin & student)
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities & API
│   ├── public/          # Static assets
│   ├── vite.config.ts   # Build config
│   └── tsconfig.json    # TypeScript config
│
├── backend/             # Backend services
│   ├── server/          # Server middleware
│   ├── migrations/      # Database schemas
│   └── scripts/         # Build & migration scripts
│
├── package.json         # Dependencies
└── README.md           # This file
```

## ✨ Features

### For Students
- 📱 Device-bound registration with QR code scanning
- ⏰ Clock in/out with unique Clock ID
- 📊 View attendance history and streak
- 🔒 Secure device locking prevents unauthorized access

### For Administrators
- 👥 Manage students and locations
- 📈 Real-time attendance dashboard
- 📋 Attendance log with filtering and CSV export
- ⏱️ **Adjust clock-in/out times** with full audit trail
- 🔍 Complete audit log for accountability
- 📍 QR code generation for locations

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Opens at: **http://localhost:8080/**

### Type Check
```bash
npm run typecheck
```

### Build for Production
```bash
npm run build
```

## 🌐 Deployment

### Deploy to Vercel

1. Go to https://vercel.com/new
2. Import: **BARDIS99/oasis-clock-in**
3. Framework: **Vite** (auto-detected)
4. Click **Deploy**

**No environment variables needed** - Supabase is pre-configured!

## 💻 Tech Stack

- **Framework:** TanStack Start (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Build Tool:** Vite 8
- **Server:** Nitro
- **Deployment:** Vercel

## 📊 Database

The app uses Supabase for data storage. Configuration is in:
- `frontend/src/lib/supabase.server.ts`

Database schema is automatically applied from:
- `backend/migrations/0002_oasis.sql`

## 🎯 Usage

### For Students/Interns
1. Visit the app URL
2. Register with your device (one-time setup)
3. Use your Clock ID to clock in/out daily
4. View your attendance history and streak

### For Supervisors/Admins
1. Navigate to `/admin`
2. Login with supervisor credentials
3. Manage students, locations, and view dashboard
4. Adjust attendance times if needed
5. Export attendance as CSV for SIWES records

## ⚙️ Time Adjustment Feature

Admins can manually correct attendance times:

1. Go to **Admin → Attendance**
2. Click **"Adjust Time"** button
3. Modify clock-in or clock-out times
4. Changes are logged in audit trail

Perfect for:
- Correcting mistakes
- Adding manual entries
- Handling offline attendance

## 🔐 Security

- Device binding prevents Clock ID sharing
- Server-side authentication for admins
- Full audit trail of all changes
- Secure password hashing (scrypt)
- Row-level security on database

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Production build
npm run build:dev        # Development build

# Database
npm run db:migrate       # Run migrations

# Quality
npm run typecheck        # Check TypeScript
```

## 🆘 Troubleshooting

**Server won't start?**
- Check if port 8080 is available
- Run `npm install` to ensure dependencies are installed

**Build fails?**
- Run `npm run typecheck` to find errors
- Check that all paths are correct

**Database connection issues?**
- Verify Supabase credentials in `frontend/src/lib/supabase.server.ts`
- Check if Supabase project is active

## 📄 License

Private project for Sandlip Oasis SIWES attendance tracking.

---

**Repository:** https://github.com/BARDIS99/oasis-clock-in  
**Built with:** TanStack Start + Supabase + TypeScript
