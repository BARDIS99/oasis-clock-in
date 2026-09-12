import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readAdminToken } from "@/lib/device";
import { formatStamp } from "@/lib/format";
import { listAudit } from "@/lib/server/oasis";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const [rows, setRows] = useState<{ id: string; action: string; details: string; created_at: string }[]>([]);
  useEffect(() => {
    const token = readAdminToken();
    if (!token) return;
    void listAudit({ data: { token } }).then(setRows);
  }, []);
  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Settings</h1>
      <p className="mt-1 text-sm text-muted">Supervisor actions are logged so Clock ID changes stay accountable.</p>
      <section className="mt-6 rounded-xl bg-surface p-5 shadow-card">
        <h2 className="font-medium">Database</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Attendance, students, and locations are stored in your Supabase project.
        </p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-accent">Open intern clock-in</Link>
      </section>
      <section className="mt-6 overflow-hidden rounded-xl bg-surface shadow-card">
        <div className="border-b border-line px-4 py-3"><h2 className="font-medium">Audit log</h2></div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">No admin actions yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.action.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted">{r.details}</p>
                </div>
                <p className="text-xs text-faint">{formatStamp(r.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
