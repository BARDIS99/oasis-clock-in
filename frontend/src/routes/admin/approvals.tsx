import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Clock, MapPin, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { readAdminToken } from "@/lib/device";
import { formatStamp } from "@/lib/format";
import { approveClockIn, getPendingClockIns, rejectClockIn } from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

export const Route = createFileRoute("/admin/approvals")({ component: ApprovalsPage });

type PendingClockIn = {
  id: string;
  student_id: string;
  student_name: string;
  clock_id: string;
  location_name: string | null;
  clock_in_time: string;
  distance_meters: number | null;
};

function ApprovalsPage() {
  const [pending, setPending] = useState<PendingClockIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function loadPending() {
    const token = readAdminToken();
    const data = await getPendingClockIns({ data: { token } });
    setPending(data);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    setBusy(id);
    try {
      await approveClockIn({ data: { token: readAdminToken(), attendanceId: id } });
      pushToast("ok", "Clock-in approved");
      await loadPending();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(id: string) {
    setBusy(id);
    try {
      await rejectClockIn({ data: { token: readAdminToken(), attendanceId: id } });
      pushToast("ok", "Clock-in rejected");
      await loadPending();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    void loadPending();
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => void loadPending(), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy dark:text-white">Clock-In Approvals</h1>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">
            Review and approve student clock-in requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-muted dark:text-slate-400">Auto-updating</span>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 text-center text-muted dark:text-slate-400">Loading...</div>
      ) : pending.length === 0 ? (
        <div className="mt-8 rounded-xl bg-surface dark:bg-slate-800 p-12 text-center shadow-card">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-4 font-display text-xl text-navy dark:text-white">All caught up!</h2>
          <p className="mt-2 text-sm text-muted dark:text-slate-400">
            No pending clock-in requests at the moment
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {pending.length} Pending Approval{pending.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-4">
            {pending.map((req) => (
              <div
                key={req.id}
                className="rounded-xl bg-surface dark:bg-slate-800 p-5 shadow-card border-2 border-amber-200 dark:border-amber-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="grid size-12 place-items-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Clock className="size-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy dark:text-white">{req.student_name}</h3>
                        <p className="text-sm font-mono text-muted dark:text-slate-400">{req.clock_id}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted dark:text-slate-400">
                        <Clock className="size-4" />
                        <span>{formatStamp(req.clock_in_time)}</span>
                      </div>
                      {req.location_name ? (
                        <div className="flex items-center gap-2 text-muted dark:text-slate-400">
                          <MapPin className="size-4" />
                          <span>{req.location_name}</span>
                        </div>
                      ) : null}
                      {req.distance_meters !== null ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-sky-600 dark:text-cyan-400" />
                          <span className={`text-sm font-medium ${
                            req.distance_meters <= 100
                              ? "text-green-600 dark:text-green-400"
                              : req.distance_meters <= 500
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {req.distance_meters}m from location
                            {req.distance_meters <= 100 ? " ✓" : req.distance_meters > 500 ? " ⚠️" : ""}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApprove(req.id)}
                      disabled={busy === req.id}
                      className="flex h-11 items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60"
                    >
                      <CheckCircle className="size-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(req.id)}
                      disabled={busy === req.id}
                      className="flex h-11 items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60"
                    >
                      <XCircle className="size-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
