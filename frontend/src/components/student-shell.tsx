import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { ProfilePictureDisplay } from "./profile-picture-upload";

export function StudentShell({ children, studentName, profilePicture }: { children: ReactNode; studentName?: string; profilePicture?: string | null }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <div className="min-h-dvh bg-gradient-to-br from-sky-50 via-white to-emerald-50 text-ink dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white transition-colors">
      <header className="border-b border-sky-200 bg-gradient-to-r from-sky-600 to-cyan-600 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <div className="relative">
              {studentName && profilePicture !== undefined ? (
                <ProfilePictureDisplay
                  pictureUrl={profilePicture}
                  name={studentName}
                  size="md"
                />
              ) : (
                <img src="/logo.svg" alt="Oasis" className="size-12 drop-shadow-md" />
              )}
            </div>
            <span>
              <span className="block font-display text-xl leading-tight tracking-tight text-white drop-shadow-sm">
                {studentName || "Oasis Clock-In"}
              </span>
              <span className="block text-xs text-sky-100 dark:text-slate-300">Sandlip Oasis · SIWES</span>
            </span>
          </Link>
          <button
            onClick={toggleTheme}
            className="rounded-lg bg-white/10 p-2 text-white transition-all hover:bg-white/20"
            title={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Toggle theme"}
          >
            {mounted ? (theme === "light" ? "🌙" : "☀️") : "🌙"}
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-5 py-6 pb-16">{children}</main>
    </div>
  );
}
