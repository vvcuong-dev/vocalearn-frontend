import { Loading } from "../../../components/ui/Loading";
import { useEffect, useState, type ReactNode } from "react";
import {
  api,
  hasSession,
  getSessionVersion,
  loginAdmin,
  logoutAdmin,
  restoreSession,
  setTokens,
  type Admin,
} from "../../../lib/api";
import { AuthContext } from "./context";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function reload() {
    const version = getSessionVersion();
    const profile = await api<Admin>("/admin/profile", "GET", undefined, true);
    if (version === getSessionVersion() && hasSession()) setAdmin(profile);
  }
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    const expired = () => setAdmin(null);
    window.addEventListener("auth-expired", expired);
    const changed = () => {
      setError("");
      setLoading(true);
      setAttempt((value) => value + 1);
    };
    window.addEventListener("auth-expired-changed", changed);
    async function restore() {
      try {
        if (await restoreSession()) {
          const profile = await api<Admin>(
            "/admin/profile",
            "GET",
            undefined,
            true,
          );
          if (active && version === getSessionVersion() && hasSession())
            setAdmin(profile);
        }
      } catch (err) {
        if (active && version === getSessionVersion())
          setError(
            err instanceof Error ? err.message : "Không thể tải tài khoản.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
      window.removeEventListener("auth-expired-changed", changed);
      window.removeEventListener("auth-expired", expired);
    };
  }, [attempt]);
  async function login(email: string, password: string) {
    await loginAdmin(email, password);
    const version = getSessionVersion();
    try {
      await reload();
    } catch (err) {
      if (hasSession() && version === getSessionVersion())
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải tài khoản. Vui lòng thử lại.",
        );
      throw err;
    }
  }
  async function logout() {
    await logoutAdmin();
    setTokens(null);
    setAdmin(null);
  }
  if (loading)
    return <Loading fullPage label="Đang kiểm tra phiên đăng nhập…" />;
  if (error)
    return (
      <main className="mx-auto mt-24 max-w-md space-y-5 p-6">
        <p role="alert">{error}</p>
        <button
          className="primary"
          onClick={() => {
            setError("");
            setLoading(true);
            setAttempt((value) => value + 1);
          }}
        >
          Thử lại
        </button>
        <button
          className="text-link"
          onClick={async () => {
            try {
              await logout();
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Logout failed");
            }
          }}
        >
          Về đăng nhập
        </button>
      </main>
    );
  return (
    <AuthContext.Provider value={{ admin, login, logout, reload }}>
      {children}
    </AuthContext.Provider>
  );
}
