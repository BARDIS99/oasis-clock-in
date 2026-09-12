import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentShell } from "~/components/student-shell";
import { getSupabase } from "~/lib/supabase.server";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

interface WeeklyGrade {
  id: string;
  week_start: string;
  week_end: string;
  attendance_score: number;
  project_score: number;
  total_score: number;
  grade: string;
  emoji: string;
  admin_comment: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

function DashboardPage() {
  const [grades, setGrades] = useState<WeeklyGrade[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSupport, setShowSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const studentData = localStorage.getItem("oasis_student");
      if (!studentData) {
        window.location.href = "/";
        return;
      }

      const student = JSON.parse(studentData);
      const supabase = getSupabase();

      // Load grades
      const { data: gradesData } = await supabase
        .from("oasis_student_grades")
        .select("*")
        .eq("student_id", student.id)
        .order("week_start", { ascending: false })
        .limit(10);

      if (gradesData) setGrades(gradesData);

      // Load support tickets
      const { data: ticketsData } = await supabase
        .from("oasis_support_tickets")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (ticketsData) setTickets(ticketsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) return;

    setSubmitting(true);
    try {
      const studentData = localStorage.getItem("oasis_student");
      if (!studentData) return;

      const student = JSON.parse(studentData);
      const supabase = getSupabase();

      const { error } = await supabase.from("oasis_support_tickets").insert({
        id: `ticket_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        student_id: student.id,
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        status: "open",
        priority: "normal",
      });

      if (!error) {
        setSupportForm({ subject: "", message: "" });
        setShowSupport(false);
        await loadData();
        alert("Support ticket submitted successfully!");
      }
    } catch (error) {
      console.error("Failed to submit ticket:", error);
      alert("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <StudentShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Dashboard
          </h1>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Back to Clock In
          </Link>
        </div>

        {/* Weekly Report Scores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📊 Weekly Performance Reports
          </h2>

          {grades.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No grades yet. Keep attending and your supervisor will grade your
              performance weekly.
            </p>
          ) : (
            <div className="space-y-4">
              {grades.map((grade) => (
                <div
                  key={grade.id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Week: {new Date(grade.week_start).toLocaleDateString()}{" "}
                        - {new Date(grade.week_end).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-4xl">{grade.emoji}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Attendance Score
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {grade.attendance_score}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Project Score
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {grade.project_score}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total Score:
                    </div>
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {grade.total_score}%
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        grade.grade === "A"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : grade.grade === "B"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : grade.grade === "C"
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                              : grade.grade === "D"
                                ? "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      }`}
                    >
                      Grade: {grade.grade}
                    </div>
                  </div>

                  {grade.admin_comment && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Supervisor Comment:
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {grade.admin_comment}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Support Care */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              💬 Support Care
            </h2>
            <button
              onClick={() => setShowSupport(!showSupport)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              {showSupport ? "Cancel" : "New Ticket"}
            </button>
          </div>

          {/* New Ticket Form */}
          {showSupport && (
            <form onSubmit={handleSubmitTicket} className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={supportForm.subject}
                  onChange={(e) =>
                    setSupportForm({ ...supportForm, subject: e.target.value })
                  }
                  placeholder="e.g., Cannot come to work tomorrow"
                  className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={supportForm.message}
                  onChange={(e) =>
                    setSupportForm({ ...supportForm, message: e.target.value })
                  }
                  placeholder="Explain your situation..."
                  rows={4}
                  className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          )}

          {/* Tickets List */}
          {tickets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No support tickets yet. If you have any issues about coming to
              work, create a ticket above.
            </p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {ticket.subject}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(ticket.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.status === "resolved"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : ticket.status === "in_progress"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {ticket.message}
                  </div>

                  {ticket.admin_response && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
                      <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Admin Response{" "}
                        {ticket.responded_at &&
                          `• ${new Date(ticket.responded_at).toLocaleString()}`}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {ticket.admin_response}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
