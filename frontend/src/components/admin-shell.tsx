import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CheckCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/approvals", label: "Clock-In Approvals", icon: CheckCircle },
  { to: "/admin/notifications", label: "Live Activity", icon: Bell },
  { to: "/admin/locations", label: "Locations", icon: MapPin },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/attendance", label: "Attendance", icon: CalendarDays },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({
  children,
  onSignOut,
  adminName,
}: {
  children: ReactNode;
  onSignOut: () => void;
  adminName: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const NavLinks = () => (
    <nav className="flex flex-col gap-2">
      {NAV.map((item) => {
        const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={
              "flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium transition-all " +
              (active
                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-300 hover:bg-white/10 hover:text-white")
            }
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-slate-100 text-ink dark:from-slate-950 dark:to-slate-900 dark:text-white lg:grid lg:grid-cols-[260px_1fr] transition-colors">
      <aside className="hidden flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-5 shadow-2xl text-on-navy lg:flex dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <img src="/logo.svg" alt="Oasis" className="size-10 drop-shadow-lg" />
          <div>
            <p className="font-display text-xl tracking-tight text-white">Oasis</p>
            <p className="text-xs text-sky-300">Supervisor Desk</p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <button
            onClick={toggleTheme}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-on-navy/50">Logged in as</p>
            <p className="text-sm font-medium text-white">{adminName}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-slate-200 bg-white shadow-sm px-5 py-4 lg:hidden dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:hover:bg-slate-700"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Oasis" className="size-8" />
            <p className="font-display text-lg text-slate-900 dark:text-white">Oasis Admin</p>
          </div>
          <button
            onClick={toggleTheme}
            className="grid size-11 place-items-center rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:hover:bg-slate-700"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </header>
        {open ? (
          <div className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-sm p-6 text-on-navy lg:hidden">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Oasis" className="size-10" />
                <p className="font-display text-xl text-white">Oasis</p>
              </div>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-6 text-white" />
              </button>
            </div>
            <NavLinks />
            <div className="mt-8 space-y-3 border-t border-white/10 pt-4">
              <p className="px-2 text-sm text-on-navy/60">{adminName}</p>
              <button
                type="button"
                onClick={onSignOut}
                className="text-sm text-red-300 hover:text-red-200"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : null}
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
