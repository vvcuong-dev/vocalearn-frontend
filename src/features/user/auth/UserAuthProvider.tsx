import { Loading } from "../../../components/ui/Loading";
import { useEffect, useState, type ReactNode } from "react";
import {
  userApi as api,
  ApiError,
  userClient,
  type Account as User,
} from "../../../lib/api";
import { UserAuthContext } from "./context";
export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function reload() {
    setUser(await api<User>("/me/profile", "GET", undefined, true));
  }
  useEffect(() => {
    let active = true;
    const expired = () => setUser(null);
    window.addEventListener("user-auth-expired", expired);
    async function restore() {
      try {
        if (userClient.hasSession()) {
          const profile = await api<User>(
            "/me/profile",
            "GET",
            undefined,
            true,
          );
          if (active) setUser(profile);
        }
      } catch (err) {
        if (err instanceof ApiError && [401, 403, 404].includes(err.status))
          userClient.setTokens(null);
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
      window.removeEventListener("user-auth-expired", expired);
    };
  }, []);
  async function login(email: string, password: string) {
    await userClient.login(email, password);
    try {
      await reload();
    } catch (err) {
      userClient.setTokens(null);
      throw err;
    }
  }
  async function logout() {
    await api("/auth/logout", "POST", undefined, true);
    userClient.setTokens(null);
    setUser(null);
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
            userClient.setTokens(null);
            setError("");
          }}
        >
          Về đăng nhập
        </button>
      </main>
    );
  return (
    <UserAuthContext.Provider value={{ user, login, logout, reload }}>
      {children}
    </UserAuthContext.Provider>
  );
}
