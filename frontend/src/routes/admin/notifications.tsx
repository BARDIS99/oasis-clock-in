import { createFileRoute } from "@tanstack/react-router";
import { Bell, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { readAdminToken } from "@/lib/device";
import { getRecentNotifications } from "@/lib/server/oasis";

export const Route = createFileRoute("/admin/notifications")({ component: NotificationsPage });

type Notification = {
  id: string;
  student_id: string;
  action: string;
  message: string;
  created_at: string;
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    const token = readAdminToken();
    const data = await getRecentNotifications({ data: { token, limit: 100 } });
    setNotifications(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadNotifications();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => void loadNotifications(), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy">Live Activity</h1>
          <p className="mt-1 text-sm text-muted">
            Real-time clock in/out notifications
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Auto-updating</span>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 text-center text-muted">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="mt-8 text-center">
          <Bell className="mx-auto size-16 text-muted opacity-30" />
          <p className="mt-4 text-muted">No activity yet today</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex items-start gap-4 rounded-lg bg-surface p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div
                className={`mt-1 grid size-10 shrink-0 place-items-center rounded-full ${
                  notif.action === "clock_in"
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <Clock className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{notif.message}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  notif.action === "clock_in"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {notif.action === "clock_in" ? "In" : "Out"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
