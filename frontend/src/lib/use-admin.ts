import { useCallback, useEffect, useState } from "react";
import { clearAdminToken, readAdminToken, saveAdminToken } from "@/lib/device";
import { adminLogout, adminMe } from "@/lib/server/oasis";

export function useAdminSession() {
  const [token, setToken] = useState("");
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = readAdminToken();
    if (!stored) {
      setChecking(false);
      return;
    }
    void adminMe({ data: { token: stored } })
      .then((me) => {
        setToken(stored);
        setAdmin({ name: me.name, email: me.email });
      })
      .catch(() => {
        clearAdminToken();
      })
      .finally(() => setChecking(false));
  }, []);

  const signIn = useCallback((next: string, profile: { name: string; email: string }) => {
    saveAdminToken(next);
    setToken(next);
    setAdmin(profile);
  }, []);

  const signOut = useCallback(() => {
    if (token) void adminLogout({ data: { token } });
    clearAdminToken();
    setToken("");
    setAdmin(null);
  }, [token]);

  return { token, admin, checking, signIn, signOut };
}
