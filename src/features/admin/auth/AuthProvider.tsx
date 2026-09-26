import { Loading } from "../../../components/ui/Loading";
import { useEffect, useState, type ReactNode } from "react";
import {
  api,
  ApiError,
  hasSession,
  loginAdmin,
  setTokens,
  type Admin,
} from "../../../lib/api";
import { AuthContext } from "./context";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function reload() {
    setAdmin(await api<Admin>("/admin/profile", "GET", undefined, true));
  }
  useEffect(() => {
    let active = true;
    const expired = () => setAdmin(null);
    window.addEventListener("auth-expired", expired);
    async function restore() {
      try {
        if (hasSession()) {
          const profile = await api<Admin>(
            "/admin/profile",
            "GET",
            undefined,
            true,
          );
          if (active) setAdmin(profile);
        }
      } catch (err) {
        if (err instanceof ApiError && [401, 403, 404].includes(err.status))
          setTokens(null);
        else if (active)
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
      window.removeEventListener("auth-expired", expired);
    };
  }, []);
  async function login(email: string, password: string) {
    await loginAdmin(email, password);
    try {
      await reload();
    } catch (err) {
      setTokens(null);
      throw err;
    }
  }
  async function logout() {
    await api("/admin/auth/logout", "POST", undefined, true);
    setTokens(null);
    setAdmin(null);
  }
  if (loading) return <Loading fullPage />;
  if (error)
    return (
      <main className="mx-auto mt-24 max-w-md space-y-5 p-6">
        <p role="alert">{error}</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Thử lại
        </button>
        <button
          className="text-link"
          onClick={() => {
            setTokens(null);
            setError("");
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
