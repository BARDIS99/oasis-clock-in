import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { readAdminToken } from "@/lib/device";
import { formatDate, formatTime, todayIso } from "@/lib/format";
import { adjustAttendanceTime, listAttendance, listLocations } from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

export const Route = createFileRoute("/admin/attendance")({ component: AttendancePage });

type Row = {
  id: string;
  day: string;
  name: string;
  clock_id: string;
  location_name: string | null;
  clock_in_time: string | null;
  clock_out_time: string | null;
  clock_in_ip: string | null;
  clock_out_ip: string | null;
  status: string;
  location_id: string | null;
};

function AttendancePage() {
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [locationId, setLocationId] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editInTime, setEditInTime] = useState("");
  const [editOutTime, setEditOutTime] = useState("");

  async function refresh(
    nextFrom = from,
    nextTo = to,
    nextLoc = locationId,
    nextQ = q,
  ) {
    const token = readAdminToken();
    setRows(
      await listAttendance({
        data: {
          token,
          from: nextFrom,
          to: nextTo,
          locationId: nextLoc || undefined,
          q: nextQ || undefined,
        },
      }),
    );
  }

  useEffect(() => {
    void listLocations({ data: { token: readAdminToken() } }).then(setLocations);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCsv() {
    const header = "Date,Student,Clock ID,Location,In,Out,In IP,Out IP,Status";
    const body = rows
      .map((r) =>
        [
          r.day,
          r.name,
          r.clock_id,
          r.location_name || "",
          r.clock_in_time || "",
          r.clock_out_time || "",
          r.clock_in_ip || "",
          r.clock_out_ip || "",
          r.status,
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oasis-attendance-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startEdit(row: Row) {
    setEditingRow(row.id);
    // Convert ISO timestamp to datetime-local format
    setEditInTime(row.clock_in_time ? toLocalDatetime(row.clock_in_time) : "");
    setEditOutTime(row.clock_out_time ? toLocalDatetime(row.clock_out_time) : "");
  }

  function cancelEdit() {
    setEditingRow(null);
    setEditInTime("");
    setEditOutTime("");
  }

  async function saveEdit(row: Row) {
    try {
      const token = readAdminToken();
      await adjustAttendanceTime({
        data: {
          token,
          attendanceId: row.id,
          clockInTime: editInTime ? toISOString(editInTime) : null,
          clockOutTime: editOutTime ? toISOString(editOutTime) : null,
        },
      });
      pushToast("ok", "Time updated successfully");
      setEditingRow(null);
      await refresh();
    } catch (err) {
      pushToast("err", (err as Error).message || "Failed to update time");
    }
  }

  // Convert ISO timestamp to HTML datetime-local format (YYYY-MM-DDTHH:MM)
  function toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Convert HTML datetime-local format to ISO string
  function toISOString(localDatetime: string): string {
    return new Date(localDatetime).toISOString();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-navy">Attendance log</h1>
          <p className="mt-1 text-sm text-muted">
            Filter by date, location, or student and export a CSV for SIWES records.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="h-11 rounded-md border border-line bg-surface px-4 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <label className="text-sm">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              void refresh(e.target.value, to, locationId, q);
            }}
            className="ml-2 h-11 rounded-md border border-line bg-surface px-3"
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              void refresh(from, e.target.value, locationId, q);
            }}
            className="ml-2 h-11 rounded-md border border-line bg-surface px-3"
          />
        </label>
        <label className="text-sm">
          Location
          <select
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);
              void refresh(from, to, e.target.value, q);
            }}
            className="ml-2 h-11 rounded-md border border-line bg-surface px-3"
          >
            <option value="">All sites</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Student
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              void refresh(from, to, locationId, e.target.value);
            }}
            placeholder="Name or Clock ID"
            className="ml-2 h-11 rounded-md border border-line bg-surface px-3"
          />
        </label>
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl bg-surface shadow-card">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">No attendance in this range.</p>
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface-2 dark:bg-gray-700 text-muted dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Clock ID</th>
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Clock In</th>
                <th className="px-4 py-2 font-medium">In IP</th>
                <th className="px-4 py-2 font-medium">Clock Out</th>
                <th className="px-4 py-2 font-medium">Out IP</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line dark:border-gray-700 hover:bg-surface-2/50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">{formatDate(r.day)}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.clock_id}</td>
                  <td className="px-4 py-3">{r.location_name || "—"}</td>
                  <td className="px-4 py-3">{formatTime(r.clock_in_time)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {r.clock_in_ip || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatTime(r.clock_out_time)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {r.clock_out_ip || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(r)}
                      className="flex items-center gap-1.5 rounded-md bg-accent/10 dark:bg-cyan-900/30 px-3 py-1.5 text-xs font-medium text-accent dark:text-cyan-400 hover:bg-accent/20 dark:hover:bg-cyan-900/50"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Adjust Time
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Time Adjustment Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-navy">Adjust Clock Times</h2>
              <button
                onClick={cancelEdit}
                className="rounded-lg p-1 hover:bg-surface"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            
            {(() => {
              const row = rows.find((r) => r.id === editingRow);
              if (!row) return null;
              
              return (
                <div className="mt-6 space-y-5">
                  <div className="rounded-lg bg-surface/50 p-4">
                    <p className="text-sm text-muted">Student</p>
                    <p className="mt-0.5 font-medium text-navy">{row.name}</p>
                    <p className="mt-0.5 text-xs font-mono text-muted">{row.clock_id}</p>
                    <p className="mt-2 text-sm text-muted">Date: {formatDate(row.day)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy">
                      Clock In Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editInTime}
                      onChange={(e) => setEditInTime(e.target.value)}
                      className="mt-1.5 h-12 w-full rounded-lg border border-line bg-bg px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Current: {formatTime(row.clock_in_time) || "Not clocked in"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy">
                      Clock Out Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editOutTime}
                      onChange={(e) => setEditOutTime(e.target.value)}
                      className="mt-1.5 h-12 w-full rounded-lg border border-line bg-bg px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Current: {formatTime(row.clock_out_time) || "Not clocked out"}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => saveEdit(row)}
                      className="flex-1 h-12 rounded-lg bg-accent font-medium text-white hover:bg-accent-dark"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 h-12 rounded-lg border border-line bg-surface font-medium hover:bg-surface-2"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-xs text-muted text-center">
                    ⚠️ Changes will be logged in the audit trail for accountability
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
