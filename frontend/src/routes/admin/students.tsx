import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { useEffect, useState } from "react";
import { readAdminToken } from "@/lib/device";
import { formatStamp } from "@/lib/format";
import { approveStudent, deleteStudent, gradeStudent, listStudents, reassignDevice, setStudentStatus } from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

export const Route = createFileRoute("/admin/students")({ component: StudentsPage });

type Row = {
  id: string;
  name: string;
  email: string;
  matric: string;
  clock_id: string;
  status: string;
  location_name: string | null;
  device_bound: boolean;
  last_in: string | null;
  approved: boolean;
};

function StudentsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [grading, setGrading] = useState<Row | null>(null);
  const [attendanceScore, setAttendanceScore] = useState(0);
  const [projectScore, setProjectScore] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!grading) return;
    setBusy(true);
    try {
      const result = await gradeStudent({
        data: {
          token: readAdminToken(),
          studentId: grading.id,
          attendanceScore,
          projectScore,
          comment,
        },
      });
      pushToast("ok", `Graded: ${result.grade} ${result.emoji}`);
      setGrading(null);
      setAttendanceScore(0);
      setProjectScore(0);
      setComment("");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to grade");
    } finally {
      setBusy(false);
    }
  }

  async function refresh(query = q) {
    const token = readAdminToken();
    setRows(await listStudents({ data: { token, q: query } }));
  }

  useEffect(() => {
    void refresh("");
  }, []);

  const filteredRows = rows.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });
  
  const pendingCount = rows.filter((r) => !r.approved).length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy dark:text-white">Students</h1>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">Search, approve, suspend, delete, or reassign a Clock ID after a lost phone.</p>
        </div>
        {pendingCount > 0 ? (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 px-4 py-2">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {pendingCount} Pending Approval{pendingCount > 1 ? "s" : ""}
            </p>
          </div>
        ) : null}
      </div>
      
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            void refresh(e.target.value);
          }}
          placeholder="Search name, email, Clock ID"
          className="h-12 w-full max-w-md rounded-md border border-line dark:border-slate-600 bg-surface dark:bg-slate-800 dark:text-white px-3 outline-none focus:border-accent dark:focus:border-cyan-400"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-accent dark:bg-cyan-600 text-white"
                : "bg-surface-2 dark:bg-slate-700 text-muted dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-600"
            }`}
          >
            All ({rows.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-amber-500 text-white"
                : "bg-surface-2 dark:bg-slate-700 text-muted dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-600"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "approved"
                ? "bg-green-500 text-white"
                : "bg-surface-2 dark:bg-slate-700 text-muted dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-600"
            }`}
          >
            Approved ({rows.filter((r) => r.approved).length})
          </button>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl bg-surface dark:bg-slate-800 shadow-card">
        {filteredRows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted dark:text-slate-400">
            {filter === "pending" ? "No pending approvals" : filter === "approved" ? "No approved students yet" : "No students registered yet."}
          </p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-2 dark:bg-slate-700 text-muted dark:text-slate-300">
              <tr>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Clock ID</th>
                <th className="px-4 py-2 font-medium">Device</th>
                <th className="px-4 py-2 font-medium">Last in</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className={"border-t border-line dark:border-slate-700 align-top " + (!r.approved ? "bg-amber-50 dark:bg-amber-900/10" : "")}>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2 py-1 text-xs font-medium " + (r.approved ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300")}>
                      {r.approved ? "✓ Approved" : "⏳ Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium dark:text-white">{r.name}</p>
                    <p className="text-xs text-muted dark:text-slate-400">{r.email}</p>
                    {r.location_name ? <p className="text-xs text-faint dark:text-slate-500">{r.location_name}</p> : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs dark:text-slate-300">{r.clock_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={"w-fit rounded-full px-2 py-1 text-xs font-medium " + (r.status === "active" ? "bg-ok-soft dark:bg-green-900/30 text-ok dark:text-green-300" : "bg-warn-soft dark:bg-amber-900/30 text-warn dark:text-amber-300")}>
                        {r.status}
                      </span>
                      <span className="text-xs text-muted dark:text-slate-400">{r.device_bound ? "Bound" : "Awaiting phone"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs dark:text-slate-300">{formatStamp(r.last_in)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {!r.approved ? (
                        <button
                          type="button"
                          className="rounded-md bg-green-600 hover:bg-green-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                          onClick={async () => {
                            try {
                              await approveStudent({ data: { token: readAdminToken(), id: r.id } });
                              pushToast("ok", `${r.name} approved`);
                              await refresh();
                            } catch (err) {
                              pushToast("error", err instanceof Error ? err.message : "Failed to approve");
                            }
                          }}
                        >
                          ✓ Approve
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-cyan-400"
                        onClick={() => {
                          setGrading(r);
                          setAttendanceScore(0);
                          setProjectScore(0);
                          setComment("");
                        }}
                      >
                        <Award className="size-3" />
                        Grade
                      </button>
                      <button type="button" className="text-xs font-medium text-accent dark:text-cyan-400" onClick={async () => {
                        const res = await reassignDevice({ data: { token: readAdminToken(), id: r.id } });
                        pushToast("ok", `New Clock ID ${res.clockId}`);
                        await refresh();
                      }}>Reassign</button>
                      <button type="button" className="text-xs font-medium dark:text-slate-300" onClick={async () => {
                        await setStudentStatus({ data: { token: readAdminToken(), id: r.id, status: r.status === "active" ? "suspended" : "active" } });
                        await refresh();
                      }}>{r.status === "active" ? "Suspend" : "Restore"}</button>
                      <button type="button" className="text-xs font-medium text-danger dark:text-red-400" onClick={async () => {
                        await deleteStudent({ data: { token: readAdminToken(), id: r.id } });
                        pushToast("ok", "Student removed");
                        await refresh();
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {grading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b pb-4">
              <Award className="size-6 text-sky-600" />
              <div>
                <h2 className="font-display text-xl text-slate-900">Grade Student</h2>
                <p className="text-sm text-slate-600">{grading.name}</p>
              </div>
            </div>
            
            <form onSubmit={handleGrade} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Attendance Score (0-50)
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={attendanceScore}
                    onChange={(e) => setAttendanceScore(Number(e.target.value))}
                    className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-slate-900 transition-colors focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">Based on punctuality and days present</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Project/Work Score (0-50)
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={projectScore}
                    onChange={(e) => setProjectScore(Number(e.target.value))}
                    className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-slate-900 transition-colors focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">Based on project quality and performance</p>
              </div>
              
              <div className="rounded-lg bg-gradient-to-r from-sky-50 to-cyan-50 p-4">
                <p className="text-xs font-medium text-sky-700">Preview</p>
                <p className="mt-1 text-2xl font-bold text-sky-900">
                  Total: {attendanceScore + projectScore}/100
                </p>
                <p className="text-sm text-sky-600">
                  Grade: {attendanceScore + projectScore >= 90 ? "A+ 🌟" : 
                          attendanceScore + projectScore >= 85 ? "A 😊" :
                          attendanceScore + projectScore >= 80 ? "B+ 👍" :
                          attendanceScore + projectScore >= 75 ? "B 🙂" :
                          attendanceScore + projectScore >= 70 ? "C+ 😐" :
                          attendanceScore + projectScore >= 65 ? "C 😕" :
                          attendanceScore + projectScore >= 60 ? "D 😟" : "F 😞"}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Comment (Optional)
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Great work this week! Keep it up..."
                    rows={3}
                    className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-sky-500 focus:outline-none"
                  />
                </label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 h-12 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
                >
                  Save Grade
                </button>
                <button
                  type="button"
                  onClick={() => setGrading(null)}
                  className="h-12 rounded-lg border-2 border-slate-300 px-6 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
