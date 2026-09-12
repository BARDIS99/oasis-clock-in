import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readAdminToken } from "@/lib/device";
import { getSupabase } from "@/lib/supabase.server";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupportPage,
});

interface SupportTicket {
  id: string;
  student_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  matric: string;
  clock_id: string;
}

function AdminSupportPage() {
  const [tickets, setTickets] = useState<(SupportTicket & { student: Student })[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filter]);

  async function loadTickets() {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("oasis_support_tickets")
        .select(`
          *,
          student:oasis_students(id, name, email, matric, clock_id)
        `)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTickets(data.map((t: any) => ({ ...t, student: t.student })));
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(ticketId: string, status: "in_progress" | "resolved") {
    if (!responseText.trim()) {
      alert("Please enter a response");
      return;
    }

    setSubmitting(true);
    try {
      const adminData = localStorage.getItem("oasis_admin");
      if (!adminData) throw new Error("Not logged in");

      const admin = JSON.parse(adminData);
      const supabase = getSupabase();

      const { error } = await supabase
        .from("oasis_support_tickets")
        .update({
          admin_response: responseText.trim(),
          responded_by: admin.id,
          responded_at: new Date().toISOString(),
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;

      setResponseText("");
      setResponding(null);
      await loadTickets();
      alert("Response sent successfully!");
    } catch (error) {
      console.error("Failed to respond:", error);
      alert("Failed to send response");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(ticketId: string, newStatus: string) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("oasis_support_tickets")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;
      await loadTickets();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading support tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            💬 Support Care
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage student support requests and inquiries
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Open</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.open}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400">In Progress</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.in_progress}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-green-600 dark:text-green-400">Resolved</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.resolved}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "in_progress"
                  ? "In Progress"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
              No tickets found
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {ticket.subject}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.status === "resolved"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : ticket.status === "in_progress"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                        }`}
                      >
                        {ticket.status === "in_progress" ? "In Progress" : ticket.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        👤 {ticket.student?.name || "Unknown"} (
                        {ticket.student?.clock_id})
                      </span>
                      <span>📅 {new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                    className="px-3 py-1 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Student Message */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Student Message:
                  </div>
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {ticket.message}
                  </div>
                </div>

                {/* Admin Response */}
                {ticket.admin_response ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-600">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                      Your Response{" "}
                      {ticket.responded_at &&
                        `• ${new Date(ticket.responded_at).toLocaleString()}`}
                    </div>
                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {ticket.admin_response}
                    </div>
                  </div>
                ) : responding === ticket.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response..."
                      rows={4}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(ticket.id, "resolved")}
                        disabled={submitting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition"
                      >
                        Send & Mark Resolved
                      </button>
                      <button
                        onClick={() => handleRespond(ticket.id, "in_progress")}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition"
                      >
                        Send & Keep Open
                      </button>
                      <button
                        onClick={() => {
                          setResponding(null);
                          setResponseText("");
                        }}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResponding(ticket.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Respond
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}