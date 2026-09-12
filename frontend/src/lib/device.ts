const TOKEN_KEY = "oasis.deviceToken";
const CLOCK_KEY = "oasis.clockId";
const STUDENT_KEY = "oasis.studentId";

export function getOrCreateDeviceToken(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;
  const token =
    crypto.randomUUID?.() ??
    `dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function deviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(window.devicePixelRatio || 1),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    navigator.hardwareConcurrency || "",
  ];
  return parts.join("|").slice(0, 400);
}

export function saveStudentSession(clockId: string, studentId: string) {
  window.localStorage.setItem(CLOCK_KEY, clockId);
  window.localStorage.setItem(STUDENT_KEY, studentId);
}

export function readStudentSession(): { clockId: string; studentId: string } | null {
  if (typeof window === "undefined") return null;
  const clockId = window.localStorage.getItem(CLOCK_KEY);
  const studentId = window.localStorage.getItem(STUDENT_KEY);
  if (!clockId || !studentId) return null;
  return { clockId, studentId };
}

export function clearStudentSession() {
  window.localStorage.removeItem(CLOCK_KEY);
  window.localStorage.removeItem(STUDENT_KEY);
}

const ADMIN_KEY = "oasis.adminToken";

export function saveAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_KEY, token);
}

export function readAdminToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_KEY) || "";
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_KEY);
}
