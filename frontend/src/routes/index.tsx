import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { QrScannerComponent } from "@/components/qr-scanner";
import { getOrCreateDeviceToken, saveStudentSession, deviceFingerprint } from "@/lib/device";
import { getStudentByClock } from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const locFromUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("loc") || ""
      : "";

  const [mounted, setMounted] = useState(false);
  const [clockId, setClockId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!clockId.trim()) return;
    
    setBusy(true);
    setError("");
    
    try {
      const res = await getStudentByClock({
        data: { clockId: clockId.trim().toUpperCase(), deviceToken: getOrCreateDeviceToken() },
      });
      
      saveStudentSession(res.student.clockId, res.student.id);
      pushToast("ok", `Welcome back, ${res.student.name}!`);
      
      // Redirect to dashboard or appropriate page
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clock ID not found");
      pushToast("err", "Clock ID not found or incorrect");
    } finally {
      setBusy(false);
    }
  }

  async function handleQrScan(data: string) {
    setShowScanner(false);
    
    try {
      // Check if it's a Clock ID (OAS-XXXXXX format)
      const clockIdMatch = data.match(/OAS-[A-Z0-9]{6}/i);
      if (clockIdMatch) {
        setClockId(clockIdMatch[0].toUpperCase());
        pushToast("ok", "Clock ID scanned!");
        return;
      }
      
      // Check if it's a location URL
      const url = new URL(data);
      const loc = url.searchParams.get("loc");
      
      if (loc) {
        // Redirect to register with location
        navigate({ to: "/register", search: { loc } });
        pushToast("ok", "Location scanned - redirecting to register...");
      }
    } catch {
      // Not a valid URL or Clock ID
      pushToast("err", "Invalid QR code");
    }
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
          {/* Quick Sign In */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h2 className="text-center text-lg font-bold text-slate-800 dark:text-white mb-4">
              Already Have Clock ID?
            </h2>
            
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={clockId}
                  onChange={(e) => setClockId(e.target.value.toUpperCase())}
                  placeholder="Enter Clock ID (OAS-XXXXXX)"
                  className="h-14 w-full rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white px-4 pr-14 font-mono text-base tracking-wider outline-none focus:border-sky-500 dark:focus:border-cyan-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-10 grid place-items-center text-sky-600 dark:text-cyan-400 hover:bg-sky-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Scan QR Code"
                >
                  <QrCode className="size-6" />
                </button>
              </div>
              
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3">
                  <p className="text-sm text-red-700 dark:text-red-400 text-center">{error}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={busy || !clockId.trim()}
                className="h-14 w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
          </div>

          {/* Register Button */}
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
            New student? Get your Clock ID and start tracking attendance
          </p>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <QrScannerComponent
            onScan={handleQrScan}
            onClose={() => setShowScanner(false)}
          />
        )}

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
