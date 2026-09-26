import { Loading } from "../../../components/ui/Loading";
import { useEffect, useState, type ReactNode } from "react";
import {
  userApi as api,
  userClient,
  type Account as User,
} from "../../../lib/api";
import { UserAuthContext } from "./context";
export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function reload() {
    const version = userClient.getSessionVersion();
    const profile = await api<User>("/me/profile", "GET", undefined, true);
    if (version === userClient.getSessionVersion() && userClient.hasSession())
      setUser(profile);
  }
  useEffect(() => {
    let active = true;
    const version = userClient.getSessionVersion();
    const expired = () => setUser(null);
    window.addEventListener("user-auth-expired", expired);
    const changed = () => {
      setError("");
      setLoading(true);
      setAttempt((value) => value + 1);
    };
    window.addEventListener("user-auth-expired-changed", changed);
    async function restore() {
      try {
        if (await userClient.restoreSession()) {
          const profile = await api<User>(
            "/me/profile",
            "GET",
            undefined,
            true,
          );
          if (
            active &&
            version === userClient.getSessionVersion() &&
            userClient.hasSession()
          )
            setUser(profile);
        }
      } catch (err) {
        if (active && version === userClient.getSessionVersion())
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
      window.removeEventListener("user-auth-expired-changed", changed);
      window.removeEventListener("user-auth-expired", expired);
    };
  }, [attempt]);
  async function login(email: string, password: string, remember = false) {
    await userClient.login(email, password, remember);
    const version = userClient.getSessionVersion();
    try {
      await reload();
    } catch (err) {
      if (userClient.hasSession() && version === userClient.getSessionVersion())
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải tài khoản. Vui lòng thử lại.",
        );
      throw err;
    }
  }
  async function logout() {
    await userClient.logout();
    userClient.setTokens(null);
    setUser(null);
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
    <UserAuthContext.Provider value={{ user, login, logout, reload }}>
      {children}
    </UserAuthContext.Provider>
  );
}
