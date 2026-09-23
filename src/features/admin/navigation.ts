import type { NavigationItem } from "../../components/dashboard/Sidebar";
export const adminNavigation: NavigationItem[] = [
  {
    to: "/admin",
    label: "Tổng quan",
    icon: "grid",
    section: "Không gian quản trị",
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    icon: "users",
    section: "Quản lý",
  },
  {
    to: "/admin/categories",
    label: "Danh mục",
    icon: "folder",
    section: "Quản lý",
  },
  {
    to: "/admin/learning-paths",
    label: "Lộ trình học",
    icon: "route",
    section: "Quản lý",
  },
  {
    to: "/admin/word-sets",
    label: "Bộ từ vựng",
    icon: "book",
    section: "Quản lý",
  },
  {
    to: "/admin/folders",
    label: "Thư mục",
    icon: "folder",
    section: "Kiểm duyệt",
  },
  {
    to: "/admin/roles",
    label: "Vai trò",
    icon: "shield",
    section: "Phân quyền",
  },
  {
    to: "/admin/permissions",
    label: "Danh sách quyền",
    icon: "shield",
    section: "Phân quyền",
  },
  {
    to: "/admin/profile",
    label: "Tài khoản",
    icon: "users",
    section: "Cá nhân",
  },
  {
    to: "/admin/change-password",
    label: "Đổi mật khẩu",
    icon: "shield",
    section: "Cá nhân",
  },
  {
    to: "/admin/change-email",
    label: "Đổi email",
    icon: "mail",
    section: "Cá nhân",
  },
];
