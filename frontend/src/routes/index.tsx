import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Lock, MapPin, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { QrScannerComponent } from "@/components/qr-scanner";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import {
  clearStudentSession,
  deviceFingerprint,
  getOrCreateDeviceToken,
  readStudentSession,
  saveStudentSession,
} from "@/lib/device";
import { formatStamp, formatTime } from "@/lib/format";
import {
  bootstrapOasis,
  claimReassignedDevice,
  clockAction,
  getStudentByClock,
  getStudentGrade,
  recoverClockId,
} from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

export const Route = createFileRoute("/")({ component: Home });

type LocationOpt = { id: string; name: string; address: string };

type TodayRow = {
  clock_in_time: string | null;
  clock_out_time: string | null;
};

function Home() {
  const navigate = useNavigate();
  const locFromUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("loc") || ""
      : "";

  const [ready, setReady] = useState(false);
  const [clockId, setClockId] = useState("");
  const [locations, setLocations] = useState<LocationOpt[]>([]);
  const [locationId, setLocationId] = useState(locFromUrl);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [deviceOk, setDeviceOk] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [today, setToday] = useState<TodayRow | null>(null);
  const [streak, setStreak] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ action: "in" | "out"; at: string; pending?: boolean } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoveredClock, setRecoveredClock] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentGrade, setCurrentGrade] = useState<{
    grade: string;
    emoji: string;
    total_score: number;
    admin_comment: string;
  } | null>(null);

  const token = useMemo(() => (ready ? getOrCreateDeviceToken() : ""), [ready]);

  useEffect(() => {
    setReady(true);
    void bootstrapOasis().then((b) => {
      setLocations(b.locations);
      if (!locationId && b.locations[0]) setLocationId(b.locations[0].id);
    });
    const session = readStudentSession();
    if (session) {
      setClockId(session.clockId);
      void loadStudent(session.clockId);
    } else {
      setLoading(false);
    }
    
    // Get user's GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.warn("GPS not available:", err);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStudent(id: string) {
    setError("");
    try {
      const res = await getStudentByClock({
        data: { clockId: id, deviceToken: getOrCreateDeviceToken() },
      });
      setName(res.student.name);
      setStudentId(res.student.id);
      setProfilePicture(res.student.profilePictureUrl || null);
      setDeviceOk(res.deviceOk);
      setCanClaim(Boolean(res.canClaim));
      setToday(res.today);
      setStreak(res.streak);
      saveStudentSession(res.student.clockId, res.student.id);
      if (res.student.locationId && !locFromUrl) setLocationId(res.student.locationId);
      
      // Load current week grade
      const grade = await getStudentGrade({ data: { studentId: res.student.id } });
      setCurrentGrade(grade);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Clock ID");
      setName("");
    } finally {
      setLoading(false);
    }
  }

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!clockId.trim()) return;
    setBusy(true);
    setLoading(true);
    await loadStudent(clockId.trim().toUpperCase());
    setBusy(false);
  }

  async function claim() {
    setBusy(true);
    setError("");
    try {
      const res = await claimReassignedDevice({
        data: {
          clockId,
          deviceToken: getOrCreateDeviceToken(),
          deviceFp: deviceFingerprint(),
        },
      });
      saveStudentSession(res.clockId, res.studentId);
      setDeviceOk(true);
      setCanClaim(false);
      pushToast("ok", "This device is now bound to your Clock ID");
      await loadStudent(res.clockId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not bind this device");
    } finally {
      setBusy(false);
    }
  }

  async function punch(action: "in" | "out") {
    setBusy(true);
    setError("");
    try {
      const res = await clockAction({
        data: {
          clockId,
          deviceToken: token,
          deviceFp: deviceFingerprint(),
          locationId: locationId || undefined,
          action,
          userLat: userLocation?.lat,
          userLng: userLocation?.lng,
        },
      });
      setConfirm({ action: res.action, at: res.at, pending: res.pending });
      if (action === "in") {
        pushToast("ok", res.pending ? "Clock-in submitted for approval" : "Clock-in recorded");
      } else {
        pushToast("ok", "Clock-out recorded");
      }
      await loadStudent(clockId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record attendance");
    } finally {
      setBusy(false);
    }
  }

  async function handleQrScan(data: string) {
    setShowScanner(false);
    
    try {
      const url = new URL(data);
      const loc = url.searchParams.get("loc");
      
      if (loc) {
        setLocationId(loc);
        pushToast("ok", "Location scanned - Clocking in...");
        
        // Auto clock-in after QR scan
        if (name && deviceOk) {
          setBusy(true);
          setError("");
          
          try {
            const res = await clockAction({
              data: {
                clockId,
                deviceToken: token,
                deviceFp: deviceFingerprint(),
                locationId: loc, // Use scanned location
                action: "in",
                userLat: userLocation?.lat,
                userLng: userLocation?.lng,
              },
            });
            
            setConfirm({ action: res.action, at: res.at, pending: res.pending });
            
            if (res.pending) {
              pushToast("ok", "✅ Clock-in submitted! Waiting for admin approval...");
            } else {
              pushToast("ok", "✅ Clock-in successful!");
            }
            
            await loadStudent(clockId);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not clock in");
            pushToast("err", "Clock-in failed. Please try again.");
          } finally {
            setBusy(false);
          }
        } else {
          pushToast("info", "Please unlock with Clock ID first");
        }
      }
    } catch {
      // Not a valid URL, ignore
      pushToast("err", "Invalid QR code");
    }
  }

  async function handleForgotClockId(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await recoverClockId({ data: { email: forgotEmail } });
      setRecoveredClock(result.clockId);
      setClockId(result.clockId);
      pushToast("ok", `Found: ${result.clockId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find Clock ID");
    } finally {
      setBusy(false);
    }
  }

  const locName = locations.find((l) => l.id === locationId)?.name || "Assigned site";
  const alreadyIn = Boolean(today?.clock_in_time);
  const alreadyOut = Boolean(today?.clock_out_time);
  const showUnlock = !loading && (!clockId || (!name && error));

  return (
    <StudentShell studentName={name} profilePicture={profilePicture}>
      {loading ? (
        <section className="rounded-xl bg-surface dark:bg-slate-800 p-5 shadow-card">
          <div className="h-3 w-28 rounded-sm bg-surface-2 dark:bg-slate-700" />
          <div className="mt-4 h-8 w-3/4 rounded-md bg-surface-2 dark:bg-slate-700" />
          <div className="mt-3 h-16 rounded-md bg-surface-2 dark:bg-slate-700" />
          <p className="mt-4 text-sm text-muted dark:text-slate-400">Checking this device…</p>
        </section>
      ) : showUnlock ? (
        <section className="rounded-xl bg-surface dark:bg-slate-800 p-5 shadow-card">
          <p className="text-xs font-medium tracking-wide text-accent dark:text-cyan-400 uppercase">
            Student sign in
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-navy dark:text-white">
            Sign in with your Clock ID
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-300">
            Enter your Clock ID to access your dashboard, clock in/out, and track your performance.
          </p>
          <form onSubmit={onUnlock} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-ink dark:text-slate-200">
              Clock ID
              <div className="relative">
                <input
                  value={clockId}
                  onChange={(e) => setClockId(e.target.value.toUpperCase())}
                  placeholder="OAS-XXXXXX"
                  autoComplete="off"
                  className="mt-1.5 h-12 w-full rounded-md border border-line dark:border-slate-600 bg-bg dark:bg-slate-900 dark:text-white px-3 pr-12 font-mono tracking-wider outline-none focus:border-accent dark:focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-8 grid place-items-center text-accent dark:text-cyan-400 hover:bg-surface-2 dark:hover:bg-slate-700 rounded"
                >
                  <QrCode className="size-5" />
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              Sign In
            </button>
          </form>
          <div className="mt-4 flex flex-col gap-2 items-center">
            <Link
              to="/register"
              search={{ loc: locFromUrl || undefined }}
              className="text-sm font-medium text-accent dark:text-cyan-400"
            >
              New student? Register here
            </Link>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-muted dark:text-slate-400 hover:text-ink dark:hover:text-white"
            >
              Forgot Clock ID?
            </button>
            {/* Hidden admin access - triple-click to reveal */}
            <Link
              to="/admin"
              className="text-[10px] text-transparent hover:text-slate-400 select-none"
              title="Admin Portal"
            >
              •
            </Link>
          </div>
          {error ? <p className="mt-3 text-sm text-danger dark:text-red-400">{error}</p> : null}
        </section>
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl bg-surface dark:bg-slate-800 p-5 shadow-card">
            <p className="text-sm text-muted dark:text-slate-400">Welcome back</p>
            <h1 className="font-display text-3xl text-navy dark:text-white">{name || "Intern"}</h1>
            <p className="mt-1 font-mono text-sm tracking-wider text-accent dark:text-cyan-400">{clockId}</p>
            {streak > 0 ? (
              <p className="mt-2 text-sm text-ok dark:text-green-400">{streak}-day present streak</p>
            ) : (
              <p className="mt-2 text-sm text-muted dark:text-slate-400">Start your streak today</p>
            )}
            
            {currentGrade ? (
              <div className="mt-4 rounded-lg bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 border-2 border-sky-200 dark:border-slate-500 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sky-700 dark:text-cyan-300 uppercase">This Week's Performance</p>
                    <p className="mt-1 text-2xl font-bold text-sky-900 dark:text-white">{currentGrade.grade}</p>
                    <p className="text-sm text-sky-600 dark:text-cyan-200">{currentGrade.total_score}/100 points</p>
                  </div>
                  <div className="text-6xl">{currentGrade.emoji}</div>
                </div>
                {currentGrade.admin_comment ? (
                  <p className="mt-3 text-xs italic text-sky-700 dark:text-cyan-200 border-t border-sky-200 dark:border-slate-500 pt-2">
                    "{currentGrade.admin_comment}"
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Profile Picture Section */}
          {studentId && (
            <section className="rounded-xl bg-surface dark:bg-slate-800 p-5 shadow-card">
              <h2 className="text-sm font-medium text-accent dark:text-cyan-400 uppercase tracking-wide">Profile Picture</h2>
              <div className="mt-4">
                <ProfilePictureUpload
                  studentId={studentId}
                  currentPictureUrl={profilePicture}
                  onSuccess={(newUrl) => setProfilePicture(newUrl)}
                />
              </div>
            </section>
          )}

          {confirm ? (
            <section className="rounded-xl border border-ok/20 bg-ok-soft dark:bg-green-900/20 dark:border-green-700 p-5 text-center">
              <div className="oasis-check mx-auto grid size-16 place-items-center rounded-full bg-ok dark:bg-green-600 text-white">
                <Check className="size-8" strokeWidth={2.5} />
              </div>
              <h2 className="mt-3 font-display text-2xl text-navy dark:text-white">
                {confirm.action === "in" ? "Clocked in" : "Clocked out"}
              </h2>
              <p className="mt-1 text-sm text-muted dark:text-slate-400">
                {formatStamp(confirm.at)} · {locName}
              </p>
              {confirm.action === "in" && confirm.pending ? (
                <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700 p-3">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    ⏳ Awaiting admin approval
                  </p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    Your supervisor will review your clock-in shortly
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          {!deviceOk ? (
            <section className="rounded-xl border border-warn/30 bg-warn-soft p-5">
              <div className="flex items-center gap-2 text-navy">
                <Lock className="size-4" />
                <h2 className="font-medium">Device not recognized</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                This Clock ID is registered to a different device.
                {canClaim
                  ? " Your supervisor reassigned it — bind this phone to continue."
                  : " Ask your supervisor to reassign the Clock ID if you changed phones."}
              </p>
              {canClaim ? (
                <button
                  type="button"
                  onClick={() => void claim()}
                  disabled={busy}
                  className="mt-4 h-12 w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                >
                  Bind this device
                </button>
              ) : null}
              {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            </section>
          ) : (
            <section className="rounded-xl bg-surface p-5 shadow-card">
              <label className="block text-sm font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-accent" />
                  Location
                </span>
                <div className="relative">
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-md border border-line bg-bg px-3 pr-12 outline-none focus:border-accent"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-8 grid place-items-center text-accent hover:bg-surface-2 rounded"
                    title="Scan location QR"
                  >
                    <QrCode className="size-5" />
                  </button>
                </div>
              </label>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-surface-2 px-3 py-3">
                  <p className="text-faint">In</p>
                  <p className="font-medium">{formatTime(today?.clock_in_time)}</p>
                </div>
                <div className="rounded-md bg-surface-2 px-3 py-3">
                  <p className="text-faint">Out</p>
                  <p className="font-medium">{formatTime(today?.clock_out_time)}</p>
                </div>
              </div>

              {!alreadyIn ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void punch("in")}
                  className="mt-5 h-14 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                >
                  Clock In
                </button>
              ) : !alreadyOut ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void punch("out")}
                  className="mt-5 h-14 w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                >
                  Clock Out
                </button>
              ) : (
                <p className="mt-5 rounded-md bg-ok-soft dark:bg-green-900/20 px-3 py-3 text-center text-sm text-ok dark:text-green-400">
                  You are done for today. See you tomorrow.
                </p>
              )}
              {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            </section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/dashboard"
              className="flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              📊 Dashboard
            </Link>
            <Link
              to="/dashboard"
              hash="support"
              className="flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              💬 Support Care
            </Link>
          </div>
          
          <div className="flex gap-3">
            <Link
              to="/history"
              className="flex h-12 flex-1 items-center justify-center rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              History
            </Link>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to sign out?")) {
                  clearStudentSession();
                  setClockId("");
                  setName("");
                  setToday(null);
                  setConfirm(null);
                  setError("");
                  setCurrentGrade(null);
                  pushToast("ok", "Signed out successfully");
                }
              }}
              className="flex h-12 flex-1 items-center justify-center rounded-lg border-2 border-red-300 dark:border-red-600 bg-white dark:bg-slate-800 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Sign Out
            </button>
            <button
              type="button"
              onClick={() => {
                navigate({ to: "/register" });
              }}
              className="flex h-12 flex-1 items-center justify-center rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      )}
      
      {showScanner ? (
        <QrScannerComponent
          onScan={handleQrScan}
          onClose={() => setShowScanner(false)}
        />
      ) : null}
      
      {showForgot ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface dark:bg-slate-800 rounded-xl p-6 shadow-2xl">
            <h2 className="font-display text-2xl text-navy dark:text-white">Recover Clock ID</h2>
            <p className="mt-2 text-sm text-muted dark:text-slate-400">
              Enter your registered email to find your Clock ID
            </p>
            <form onSubmit={handleForgotClockId} className="mt-6 space-y-3">
              <label className="block text-sm font-medium dark:text-slate-200">
                Email
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-md border border-line dark:border-slate-600 bg-bg dark:bg-slate-900 dark:text-white px-3 outline-none focus:border-accent dark:focus:border-cyan-400"
                />
              </label>
              {recoveredClock ? (
                <div className="rounded-md bg-ok-soft dark:bg-green-900/20 border border-ok/20 dark:border-green-700 p-4 text-center">
                  <p className="text-sm text-muted dark:text-slate-400">Your Clock ID:</p>
                  <p className="mt-1 font-mono text-xl tracking-wider text-accent dark:text-cyan-400">{recoveredClock}</p>
                </div>
              ) : null}
              {error ? <p className="text-sm text-danger dark:text-red-400">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 h-12 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                >
                  Find Clock ID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotEmail("");
                    setRecoveredClock("");
                    setError("");
                  }}
                  className="h-12 px-4 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </StudentShell>
  );
}
