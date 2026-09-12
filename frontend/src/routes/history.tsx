import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { getOrCreateDeviceToken, readStudentSession } from "@/lib/device";
import { formatDate, formatTime, todayIso } from "@/lib/format";
import { getStudentByClock } from "@/lib/server/oasis";

export const Route = createFileRoute("/history")({ component: HistoryPage });

type Row = {
  day: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: string;
};

function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [streak, setStreak] = useState(0);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readStudentSession();
    if (!session) {
      setMissing(true);
      setLoading(false);
      return;
    }
    void getStudentByClock({
      data: { clockId: session.clockId, deviceToken: getOrCreateDeviceToken() },
    })
      .then((res) => {
        setName(res.student.name);
        setRows(res.history);
        setStreak(res.streak);
      })
      .finally(() => setLoading(false));
  }, []);

  const presentDays = useMemo(
    () => new Set(rows.filter((r) => r.clock_in_time).map((r) => r.day.slice(0, 10))),
    [rows],
  );

  const week = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = todayIso(d);
      return { key, label: d.toLocaleDateString([], { weekday: "narrow" }), present: presentDays.has(key) };
    });
  }, [presentDays]);

  return (
    <StudentShell>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">{name || "Attendance"}</p>
          <h1 className="font-display text-3xl text-navy">History</h1>
        </div>
        <p className="text-sm text-ok">{streak} day streak</p>
      </div>
      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {week.map((d) => (
          <div key={d.key} className={"rounded-md px-1 py-2 text-center text-xs " + (d.present ? "bg-ok-soft text-ok" : "bg-surface text-muted shadow-card")}>
            <p className="font-medium">{d.label}</p>
            <p className="mt-1 tabular-nums">{d.key.slice(8)}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="rounded-xl bg-surface p-5 text-sm text-muted shadow-card">Loading history…</div>
      ) : missing ? (
        <div className="rounded-xl bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">No Clock ID saved on this device yet.</p>
          <Link to="/" className="mt-3 inline-block text-sm font-medium text-accent">Go to clock-in</Link>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">No attendance recorded yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.day} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 shadow-card">
              <div>
                <p className="font-medium">{formatDate(row.day)}</p>
                <p className="text-xs text-muted">{formatTime(row.clock_in_time)} – {formatTime(row.clock_out_time)}</p>
              </div>
              <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + (row.clock_in_time ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger")}>
                {row.clock_in_time ? "Present" : "Absent"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </StudentShell>
  );
}
