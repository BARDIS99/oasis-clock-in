import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/student-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const locFromUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("loc") || ""
      : "";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <StudentShell>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-pulse text-4xl">⏰</div>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center space-y-8 py-8">
        {/* Hero Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-sky-500/40 dark:shadow-sky-400/30 transform hover:scale-105 transition-transform">
            <span className="text-7xl">⏰</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-cyan-400 dark:to-blue-400">
            Oasis Clock-In
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 font-medium">
            SIWES Attendance System
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sandlip Oasis · Industrial Training
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
          <div className="group rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 p-6 text-center hover:shadow-xl hover:scale-105 transition-all">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">✅</div>
            <p className="text-sm font-bold text-green-800 dark:text-green-300">Easy Clock In</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">QR & GPS Verified</p>
          </div>
          
          <div className="group rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 p-6 text-center hover:shadow-xl hover:scale-105 transition-all">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Performance</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Track Your Progress</p>
          </div>
          
          <div className="group rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 p-6 text-center hover:shadow-xl hover:scale-105 transition-all">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📍</div>
            <p className="text-sm font-bold text-purple-800 dark:text-purple-300">Location Lock</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Secure & Accurate</p>
          </div>
          
          <div className="group rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-700 p-6 text-center hover:shadow-xl hover:scale-105 transition-all">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔒</div>
            <p className="text-sm font-bold text-orange-800 dark:text-orange-300">One Device</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Anti-Fraud System</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="w-full max-w-md space-y-4 mt-8">
          <Link
            to="/register"
            search={{ loc: locFromUrl || undefined }}
            className="block h-16 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 hover:from-sky-700 hover:via-cyan-700 hover:to-blue-700 text-white font-bold text-lg shadow-2xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎓</span>
            <span>Register Now</span>
            <span className="text-2xl">→</span>
          </Link>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Get your Clock ID and start tracking attendance
          </p>
        </div>

        {/* Hidden Admin Access */}
        <div className="mt-8">
          <Link
            to="/admin"
            className="text-[8px] text-transparent hover:text-slate-400 select-none transition-colors"
            title="Admin Portal"
          >
            •
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
