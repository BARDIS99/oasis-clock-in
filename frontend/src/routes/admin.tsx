import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAdminSession } from "@/lib/use-admin";
import { adminLogin, bootstrapOasis, createFirstAdmin } from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const session = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [hasAdmin, setHasAdmin] = useState(false);
  const [needsSchema, setNeedsSchema] = useState(false);
  const [schemaSql, setSchemaSql] = useState("");
  const [statusReady, setStatusReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function loadStatus() {
    const b = await bootstrapOasis();
    setHasAdmin(b.hasAdmin);
    setNeedsSchema(Boolean(b.needsSchema));
    setSchemaSql(b.schemaSql || "");
    setStatusReady(true);
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!hasAdmin) {
        const res = await createFirstAdmin({ data: { name, email, password } });
        session.signIn(res.token, res.admin);
        setHasAdmin(true);
        pushToast("ok", "Supervisor account created");
      } else {
        const res = await adminLogin({ data: { email, password } });
        session.signIn(res.token, res.admin);
        pushToast("ok", "Signed in");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      if (message === "SCHEMA_MISSING") {
        setNeedsSchema(true);
        setError("Create the attendance tables in Supabase first, then refresh.");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (session.checking || !statusReady) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        Checking supervisor session…
      </div>
    );
  }

  if (!session.admin || !session.token) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <img src="/logo.svg" alt="Oasis" className="mx-auto size-20 drop-shadow-2xl" />
            <h1 className="mt-4 font-display text-3xl text-white">Oasis Admin</h1>
            <p className="mt-2 text-sm text-slate-400">Supervisor Dashboard</p>
          </div>
          
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <p className="text-xs font-semibold tracking-wide text-sky-600 uppercase">Supervisor</p>
            <h2 className="mt-2 font-display text-2xl text-slate-900">
              {needsSchema ? "Connect database" : hasAdmin ? "Sign In" : "Create Account"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {needsSchema
                ? "Your Supabase project is linked. Run this SQL once in the Supabase SQL editor, then continue."
                : hasAdmin
                  ? "Sign in to manage locations, Clock IDs, and attendance."
                  : "No supervisor exists yet. Create the first admin account for this site."}
            </p>
          {needsSchema ? (
            <div className="mt-6 space-y-4">
              <textarea
                readOnly
                value={schemaSql}
                className="h-40 w-full rounded-lg border-2 border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(schemaSql);
                  pushToast("ok", "SQL copied");
                }}
                className="h-12 w-full rounded-lg border-2 border-slate-300 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Copy SQL
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void loadStatus().finally(() => setBusy(false));
                }}
                className="h-12 w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
              >
                I ran the SQL — continue
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {!hasAdmin ? (
                <label className="block text-sm font-semibold text-slate-700">
                  Full Name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-slate-900 transition-colors focus:border-sky-500 focus:outline-none"
                  />
                </label>
              ) : null}
              <label className="block text-sm font-semibold text-slate-700">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-slate-900 transition-colors focus:border-sky-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={hasAdmin ? 1 : 8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-4 pr-12 text-slate-900 transition-colors focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="h-13 w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-xl hover:shadow-sky-500/40 disabled:opacity-60"
              >
                {hasAdmin ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}
          {error ? (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell adminName={session.admin.name} onSignOut={session.signOut}>
      <Outlet />
    </AdminShell>
  );
}
