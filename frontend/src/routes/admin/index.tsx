import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readAdminToken } from "@/lib/device";
import { formatTime } from "@/lib/format";
import { adminDashboard } from "@/lib/server/oasis";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

type Today = {
  id: string;
  name: string;
  clock_id: string;
  location_name: string | null;
  clock_in_time: string | null;
  clock_out_time: string | null;
};

function Dashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, activeLocations: 0 });
  const [rows, setRows] = useState<Today[]>([]);
  useEffect(() => {
    const token = readAdminToken();
    if (!token) return;
    void adminDashboard({ data: { token } }).then((d) => {
      setStats({
        totalStudents: d.totalStudents,
        presentToday: d.presentToday,
        absentToday: d.absentToday,
        activeLocations: d.activeLocations,
      });
      setRows(d.today);
    });
  }, []);
  const cards = [
    { label: "Total students", value: stats.totalStudents },
    { label: "Present today", value: stats.presentToday },
    { label: "Absent today", value: stats.absentToday },
    { label: "Active locations", value: stats.activeLocations },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Today</h1>
      <p className="mt-1 text-sm text-muted">Live SIWES attendance across Oasis sites.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-surface p-4 shadow-card">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 font-display text-3xl tabular-nums text-navy">{c.value}</p>
          </div>
        ))}
      </div>
      <section className="mt-8 overflow-hidden rounded-xl bg-surface shadow-card">
        <div className="border-b border-line px-4 py-3"><h2 className="font-medium">Clock-ins today</h2></div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">No attendance yet today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">Clock ID</th>
                  <th className="px-4 py-2 font-medium">Location</th>
                  <th className="px-4 py-2 font-medium">In</th>
                  <th className="px-4 py-2 font-medium">Out</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.clock_id}</td>
                    <td className="px-4 py-3">{r.location_name || "—"}</td>
                    <td className="px-4 py-3">{formatTime(r.clock_in_time)}</td>
                    <td className="px-4 py-3">{formatTime(r.clock_out_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
