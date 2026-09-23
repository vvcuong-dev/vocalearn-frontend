# VocaLearn Admin

Frontend quản trị dùng React, TypeScript, Tailwind CSS và React Router. Giao diện auth dựa trên mẫu `project-1-admin` (nền SVG được sao chép vào `public/bg-account.svg`).

## Chạy local

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Mở http://localhost:5173/admin/login. `VITE_API_URL` mặc định là `http://localhost:3000/api`.

Backend: chạy `pnpm start:dev` trong `vocalearn-backend`, với database, Redis và các biến môi trường theo `.env.example`. CORS mặc định cho phép `http://localhost:5173` và `http://127.0.0.1:5173`.

```dotenv
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ADMIN_RESET_PASSWORD_URL=http://localhost:5173/admin/reset-password
```

Khi deploy, đổi cả hai URL tương ứng domain thực tế, cấu hình `VITE_API_URL` trước khi build và cho web server fallback các route frontend về `index.html`. `CORS_ORIGINS` nhận nhiều origin phân cách bằng dấu phẩy, không có dấu `/` cuối.

## Luồng đã nối API

- `/admin/login`: đăng nhập bằng tài khoản admin có sẵn trong database.
- `/admin/forgot-password`: gửi link reset qua email (cần cấu hình Gmail và worker mail/Redis hoạt động).
- `/admin/reset-password?token=...`: đặt lại mật khẩu bằng token từ email; backend không dùng OTP.
- `/admin`: dashboard quản trị; `/admin/profile`: tài khoản, kiểm tra quyền admin bằng `GET /api/admin/profile`.
- `/admin/change-password`, `/admin/change-email`: cập nhật thông tin đăng nhập.
- Đăng xuất gọi API để thu hồi phiên; lỗi mạng được hiển thị để thử lại.

Token lưu trong `sessionStorage`, giữ phiên khi reload trong cùng tab và xóa khi đóng tab. API client tự refresh khi gặp 401, gom các yêu cầu refresh đồng thời, thử lại request một lần; refresh hết hạn đưa về đăng nhập. Không có đăng ký admin công khai. Backend vẫn là nơi kiểm tra quyền thực tế.

## Kiểm tra

```powershell
pnpm build
pnpm lint
node --test tests/api.test.mjs
```

Kiểm tra tích hợp thủ công với tài khoản admin thật: đăng nhập sai/đúng; reload trang; hết hạn access token; đổi email/mật khẩu; đăng xuất rồi truy cập lại `/admin`; gửi email reset và mở link. Các bài test API client dùng mock, không gửi email hoặc thay đổi tài khoản thật.

## Cấu trúc frontend

- `src/App.tsx`: khởi tạo browser router.
- `src/routes/AppRoutes.tsx`: khai báo route; provider phiên admin chỉ bao quanh `/admin`.
- `src/features/admin/auth`: context, provider, form và cấu hình auth admin.
- `src/features/admin/pages`: dashboard, auth, tài khoản và trang danh sách.
- `src/features/admin/components`: layout admin, thẻ tổng quan, bảng dữ liệu.
- `src/features/admin/api`: kiểu dữ liệu và cấu hình các danh sách theo API backend.
- `src/layouts/DashboardLayout.tsx`: khung sidebar/header sau đăng nhập, nhận menu và thông tin tài khoản qua props để tái sử dụng cho user.
- `src/components`: component giao diện dùng chung, không phụ thuộc phiên admin.
- `src/hooks/useApiQuery.ts`: tải dữ liệu, làm mới và bỏ qua kết quả request cũ khi chuyển trang.
- `src/lib/api.ts`: HTTP client và xử lý token admin hiện tại.

`/admin` là dashboard; tài khoản chuyển sang `/admin/profile`. Các trang `/admin/users`, `/admin/categories`, `/admin/learning-paths`, `/admin/word-sets` hiện hỗ trợ xem danh sách, tìm kiếm và phân trang. Thống kê lấy từ `pagination.totalRecord`; lỗi quyền truy cập được hiển thị riêng, không giả định bằng 0. Chưa triển khai CRUD ở các trang danh sách.

Phần user là bước tiếp theo: thêm layout công khai chung cho landing page và login, sau đăng nhập dùng lại `DashboardLayout` với menu user. Không tạo sẵn file rỗng hoặc route user chưa có chức năng. `/` tạm chuyển về `/admin`. Khi thêm auth user, cần tách session/token theo actor trong API client, không dùng phiên admin cho user.

