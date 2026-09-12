import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import {
  deviceFingerprint,
  getOrCreateDeviceToken,
  saveStudentSession,
} from "@/lib/device";
import { bootstrapOasis, registerStudent } from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

type Search = { loc?: string };

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    loc: typeof s.loc === "string" ? s.loc : undefined,
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { loc } = Route.useSearch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [matric, setMatric] = useState("");
  const [locationId, setLocationId] = useState(loc || "");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ clockId: string; name: string } | null>(null);

  useEffect(() => {
    void bootstrapOasis().then((b) => {
      setLocations(b.locations);
      setLocationId((current) => current || loc || b.locations[0]?.id || "");
    });
  }, [loc]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      // Auto-generate email from name if not provided
      const autoEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@oasis.local`;
      
      const res = await registerStudent({
        data: {
          name,
          email: autoEmail,
          matric,
          locationId,
          deviceToken: getOrCreateDeviceToken(),
          deviceFp: deviceFingerprint(),
        },
      });
      saveStudentSession(res.clockId, res.studentId);
      setDone({ clockId: res.clockId, name: res.name });
      pushToast("ok", "Device registered");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudentShell>
      {done ? (
        <section className="rounded-xl bg-surface dark:bg-slate-800 p-5 text-center shadow-card">
          <div className="oasis-check mx-auto grid size-16 place-items-center rounded-full bg-ok dark:bg-green-600 text-white">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 font-display text-3xl text-navy dark:text-white">You are registered</h1>
          <p className="mt-2 text-sm text-muted dark:text-slate-400">Keep this Clock ID. It only works on this phone.</p>
          <p className="mt-5 font-mono text-2xl tracking-widest text-accent dark:text-cyan-400">{done.clockId}</p>
          <button 
            type="button" 
            onClick={() => navigate({ to: "/" })} 
            className="mt-6 h-12 w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            Go to clock-in
          </button>
        </section>
      ) : (
        <section className="rounded-xl bg-surface dark:bg-slate-800 p-5 shadow-card">
          <p className="text-xs font-medium tracking-wide text-accent dark:text-cyan-400 uppercase">First-time setup</p>
          <h1 className="mt-2 font-display text-3xl text-navy dark:text-white">Register this device</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-300">
            Your Clock ID will be locked to this phone. Another device cannot clock in on your behalf.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <Field label="Full name">
              <input 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Ahmed Ibrahim"
                className="h-12 w-full rounded-md border border-line dark:border-slate-600 bg-bg dark:bg-slate-900 dark:text-white px-3 outline-none focus:border-accent dark:focus:border-cyan-400" 
              />
            </Field>
            <Field label="Matric number (optional)">
              <input 
                value={matric} 
                onChange={(e) => setMatric(e.target.value)} 
                placeholder="e.g., 19/ENG01/001"
                className="h-12 w-full rounded-md border border-line dark:border-slate-600 bg-bg dark:bg-slate-900 dark:text-white px-3 outline-none focus:border-accent dark:focus:border-cyan-400" 
              />
            </Field>
            <Field label="Primary location">
              <select 
                required 
                value={locationId} 
                onChange={(e) => setLocationId(e.target.value)} 
                className="h-12 w-full rounded-md border border-line dark:border-slate-600 bg-bg dark:bg-slate-900 dark:text-white px-3 outline-none focus:border-accent dark:focus:border-cyan-400"
              >
                {locations.length === 0 ? <option value="">No sites yet — ask a supervisor</option> : null}
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </Field>
            <button 
              type="submit" 
              disabled={busy || locations.length === 0} 
              className="h-12 w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              Register
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-danger dark:text-red-400">{error}</p> : null}
          <Link to="/" className="mt-4 block text-center text-sm text-muted dark:text-slate-400 hover:text-accent dark:hover:text-cyan-400">Already have a Clock ID</Link>
        </section>
      )}
    </StudentShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-ink dark:text-slate-200">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
