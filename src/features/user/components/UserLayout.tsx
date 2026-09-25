import { useState, type CSSProperties } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { DashboardLayout } from "../../../layouts/DashboardLayout";
import type { NavigationItem } from "../../../components/dashboard/Sidebar";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserAuth } from "../auth/context";
const items: NavigationItem[] = [
  { to: "/learn", label: "Góc học tập", icon: "grid", section: "Học mỗi ngày" },
  {
    to: "/learn/explore",
    label: "Khám phá lộ trình",
    icon: "route",
    section: "Học mỗi ngày",
  },
  {
    to: "/learn/library",
    label: "Thư viện của tôi",
    icon: "folder",
    section: "Học mỗi ngày",
  },
  {
    to: "/learn/profile",
    label: "Hồ sơ cá nhân",
    icon: "users",
    section: "Tài khoản",
  },
  {
    to: "/learn/change-password",
    label: "Đổi mật khẩu",
    icon: "shield",
    section: "Tài khoản",
  },
  {
    to: "/learn/change-email",
    label: "Đổi email",
    icon: "mail",
    section: "Tài khoản",
  },
  {
    to: "/",
    label: "Về trang giới thiệu",
    icon: "arrow",
    section: "VocaLearn",
  },
];
export function UserLayout() {
  const { user, logout } = useUserAuth();
  const { pathname, search } = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user)
    return <Navigate to="/login" state={{ from: pathname + search }} replace />;
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng xuất.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ "--color-brand": "#0f766e" } as CSSProperties}>
      <DashboardLayout
        items={items}
        home="/learn"
        label="LEARNING SPACE"
        name={user.name}
        title={items.find((item) => item.to === pathname)?.label || "Học tập"}
        profilePath="/learn/profile"
        onLogout={signOut}
        loggingOut={busy}
      >
        {error && <QueryState error={error} />}
        <Outlet />
      </DashboardLayout>
    </div>
  );
}
