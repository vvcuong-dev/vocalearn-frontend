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

Token admin lưu trong `sessionStorage`, giữ phiên khi reload trong cùng tab và xóa khi đóng tab. API client tự refresh khi gặp 401, gom các yêu cầu refresh đồng thời trong cùng tab, thử lại request một lần; refresh hết hạn đưa về đăng nhập. Không có đăng ký admin công khai. Backend vẫn là nơi kiểm tra quyền thực tế.

## Kiểm tra

```powershell
pnpm build
pnpm lint
pnpm test
```

Kiểm tra tích hợp thủ công với tài khoản admin thật: đăng nhập sai/đúng; reload trang; hết hạn access token; đổi email/mật khẩu; đăng xuất rồi truy cập lại `/admin`; gửi email reset và mở link. Các bài test API client dùng mock, không gửi email hoặc thay đổi tài khoản thật.

## Cấu trúc frontend

- `src/App.tsx`: khởi tạo browser router.
- `src/routes/router.tsx`: khởi tạo `createBrowserRouter`; cấu hình chia thành `publicRoutes.tsx`, `userRoutes.tsx`, `adminRoutes.tsx`. Provider phiên admin chỉ bao quanh `/admin`; các trang được tải khi truy cập.
- `src/features/admin/auth`: context, provider, form và cấu hình auth admin.
- `src/features/admin/pages`: dashboard, auth, tài khoản và trang danh sách.
- `src/features/admin/components`: layout admin, thẻ tổng quan, bảng dữ liệu.
- `src/features/admin/api`: kiểu dữ liệu và cấu hình các danh sách theo API backend.
- `src/layouts/DashboardLayout.tsx`: khung sidebar/header sau đăng nhập, nhận menu và thông tin tài khoản qua props để tái sử dụng cho user.
- `src/components`: component giao diện dùng chung, không phụ thuộc phiên admin.
- `src/components/ui/Loading.tsx`: loading dùng `react-spinners`, dùng chung cho tải trang, dữ liệu và khôi phục phiên.
- `src/lib/form-validation.ts`: schema Zod cho auth, CRUD, hồ sơ, avatar và ánh xạ lỗi API về từng trường. Form dùng React Hook Form: login `onSubmit`, các form nhập liệu khác `onTouched`; lỗi hiện dưới ô nhập. Các ô tìm kiếm không cần schema riêng.
- `src/hooks/useApiQuery.ts`: tải dữ liệu, làm mới và bỏ qua kết quả request cũ khi chuyển trang.
- `src/lib/api.ts`: HTTP client và xử lý token admin hiện tại.

`/admin` là dashboard; tài khoản ở `/admin/profile`. Thống kê lấy từ `pagination.totalRecord`; lỗi quyền truy cập được hiển thị riêng, không giả định bằng 0.

## Chức năng quản trị

| Đường dẫn | Chức năng |
| --- | --- |
| `/admin/users` | Danh sách, tìm kiếm, phân trang, tạo, xem/sửa, xóa mềm học viên |
| `/admin/categories` | CRUD danh mục |
| `/admin/learning-paths` | CRUD lộ trình; chọn danh mục, độ khó, hiển thị, thứ tự |
| `/admin/word-sets` | CRUD bộ từ; chọn lộ trình khi tạo, cấu hình Pro, mở danh sách từ |
| `/admin/words?wordSetId=ID` | Danh sách và CRUD từng từ, phiên âm, từ loại, nghĩa, ví dụ, audio URL, ghi chú |
| `/admin/folders` | Tìm kiếm, xem chi tiết/bộ từ bên trong, ẩn/hiện thư mục |
| `/admin/roles` | CRUD vai trò, xem và thay thế các quyền qua trang phân quyền |
| `/admin/permissions` | Danh sách quyền nhóm theo module |
| `/admin/profile` | Sửa họ tên/số điện thoại, tải avatar JPEG/PNG/WebP tối đa 5 MB |

Các thao tác xóa và thay đổi quyền có hộp thoại xác nhận. Chọn danh mục/lộ trình hỗ trợ tìm kiếm và phân trang. Backend quyết định quyền thực thi; FE hiển thị thông báo khi bị từ chối. API hiện không có endpoint cung cấp toàn bộ quyền của admin đang đăng nhập, nên các nút không được ẩn theo quyền từng tài khoản.

Giới hạn theo API: user chỉ có trạng thái `ACTIVE`; không sửa mã vai trò sau khi tạo; không sửa/xóa vai trò hệ thống; không sửa bộ từ cá nhân hoặc từ vựng bên trong qua API admin; bộ từ có từ vựng phải xóa hết từ trước khi xóa bộ. Backend không có API admin tạo/xóa thư mục. Khi thêm từ, FE gửi một phần tử trong mảng `words` theo contract batch của backend.

## Landing page và khu vực người học

Mở `/` để xem landing page. Các màn `/login`, `/register`, `/forgot-password`, `/reset-password?token=...` dùng chung header/footer với landing page. Đăng ký thành công hiển thị liên kết đăng nhập, đúng response đăng ký không có token của backend.

Sau đăng nhập, `/learn` sử dụng `DashboardLayout` với menu học tập và màu xanh lá riêng:

- `/learn/explore`: lộ trình theo danh mục và thông tin chi tiết lộ trình.
- `/learn/library`: hiển thị chung thư mục và bộ từ độc lập từ `/me/library`, hỗ trợ tìm kiếm, phân trang và tạo mới.
- `/learn/folders/:id`: bộ từ trong thư mục; chủ sở hữu có thể đổi tên, xóa, chuyển công khai/riêng tư.
- `/learn/word-sets/:id`: danh sách từ, tìm kiếm, phát audio URL khi có, flashcard và CRUD từ thuộc sở hữu của mình.
- `/learn/profile`, `/learn/change-email`, `/learn/change-password`: thông tin cá nhân, avatar và bảo mật.

Flashcard dùng các từ trên trang hiện tại, không lưu lịch sử học, điểm số hay tiến độ vì backend chưa có API tương ứng. Bộ từ chính thức và thư mục công khai của người khác chỉ được xem; backend vẫn kiểm tra quyền với mọi request.

`src/features/user` chứa các trang, auth, component và payload riêng. HTTP client chia hai phiên `vocalearn.admin.session` và `vocalearn.user.session`, mỗi phiên có refresh token, hàng đợi refresh và sự kiện hết hạn riêng. Đăng xuất user không xóa phiên admin.

Màn đăng nhập user có “Ghi nhớ đăng nhập trên thiết bị này”, mặc định bật: token lưu trong `localStorage` và được khôi phục khi mở lại web. Bỏ chọn sẽ chỉ lưu trong `sessionStorage`. Token được xoay qua `/auth/refresh-token` vẫn lưu theo lựa chọn ban đầu; đăng xuất hoặc refresh token không còn hợp lệ sẽ xóa phiên đã lưu. Thời hạn phiên do backend quyết định qua `JWT_REFRESH_EXPIRES_IN`, FE không kéo dài token đã hết hạn.

Frontend sử dụng API backend hiện có. Trang thư mục cá nhân lọc bộ từ từ `/me/word-sets` theo thư mục; không có trang danh sách bộ từ riêng. API hiện chưa cung cấp danh sách bộ từ trong lộ trình hoặc thư mục của người khác, nên FE chưa hiển thị các danh sách này.

Cấu hình trong `.env` backend để email reset mở đúng frontend:

```dotenv
CLIENT_RESET_PASSWORD_URL=http://localhost:5173/reset-password
ADMIN_RESET_PASSWORD_URL=http://localhost:5173/admin/reset-password
```

Khởi động lại backend sau khi cập nhật API hoặc biến môi trường. Cần database, Redis, mail worker và Cloudinary hoạt động để kiểm tra đầy đủ đăng nhập, email reset và avatar.

