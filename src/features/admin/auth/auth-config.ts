export type AuthMode =
  | "login"
  | "forgot-password"
  | "reset-password"
  | "change-password"
  | "change-email";
export const titles: Record<AuthMode, string> = {
  login: "Đăng nhập",
  "forgot-password": "Quên mật khẩu?",
  "reset-password": "Đặt lại mật khẩu",
  "change-password": "Đổi mật khẩu",
  "change-email": "Đổi email",
};
export const descriptions: Record<AuthMode, string> = {
  login: "Chào mừng trở lại! Đăng nhập để quản lý VocaLearn.",
  "forgot-password": "Nhập email quản trị viên để nhận link đặt lại mật khẩu.",
  "reset-password": "Tạo mật khẩu mới để tiếp tục truy cập tài khoản.",
  "change-password": "Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.",
  "change-email": "Xác nhận mật khẩu hiện tại để cập nhật email đăng nhập.",
};
