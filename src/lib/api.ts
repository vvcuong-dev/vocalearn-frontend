export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
export interface Account {
  phone?: string | null;
  avatar?: string | null;
  id: number;
  name: string;
  email: string;
  status: string;
}
export type Admin = Account;
const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");
const messages: Record<string, string> = {
  CANNOT_MODIFY_SYSTEM_ROLE: "Không được sửa hoặc xóa vai trò hệ thống.",
  ROLE_ALREADY_EXISTS: "Mã vai trò đã tồn tại.",
  ROLE_NOT_FOUND: "Vai trò không còn tồn tại.",
  PERMISSION_NOT_FOUND: "Một số quyền đã thay đổi. Hãy tải lại trang.",
  CATEGORY_ALREADY_EXISTS: "Danh mục đã tồn tại.",
  CATEGORY_NOT_FOUND: "Danh mục không còn tồn tại.",
  LEARNING_PATH_NOT_FOUND: "Lộ trình không tồn tại hoặc chưa được kích hoạt.",
  LEARNING_PATH_DUPLICATED: "Lộ trình này đã tồn tại.",
  WORD_SET_NOT_FOUND: "Bộ từ không còn tồn tại.",
  WORD_SET_HAS_WORDS: "Bộ từ vẫn còn từ vựng. Hãy xóa các từ bên trong trước.",
  WORD_NOT_FOUND: "Từ vựng không còn tồn tại.",
  FOLDER_NOT_FOUND: "Thư mục không còn tồn tại.",
  PHONE_INVALID: "Số điện thoại Việt Nam không hợp lệ.",
  NAME_TOO_SHORT: "Tên cần ít nhất 5 ký tự.",
  NAME_TOO_LONG: "Tên không được vượt quá 50 ký tự.",
  AVATAR_INVALID: "URL ảnh đại diện không hợp lệ.",
  UPLOAD_FAILED: "Không thể tải ảnh lên. Vui lòng thử lại.",
  INVALID_FILE_TYPE: "Định dạng ảnh không được hỗ trợ.",
  FILE_TOO_LARGE: "Ảnh vượt quá dung lượng cho phép.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  ACCOUNT_NOT_ACTIVE: "Tài khoản đã bị khóa hoặc chưa được kích hoạt.",
  OLD_PASSWORD_INCORRECT: "Mật khẩu hiện tại không chính xác.",
  PASSWORD_INCORRECT: "Mật khẩu không chính xác.",
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
  EMAIL_SAME_AS_OLD: "Email mới phải khác email hiện tại.",
  EMAIL_INVALID: "Email không hợp lệ.",
  PASSWORD_TOO_WEAK:
    "Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.",
  PASSWORD_TOO_LONG: "Mật khẩu tối đa 72 ký tự.",
  INVALID_RESET_TOKEN:
    "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.",
  RESET_TOKEN_EXPIRED: "Link đặt lại mật khẩu đã hết hạn.",
  PERMISSION_DENIED: "Bạn không có quyền truy cập chức năng này.",
};
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
async function request<T>(
  path: string,
  method: string,
  body?: unknown,
  accessToken?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      ...(body
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Vui lòng thử lại.");
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    const code = result?.errors?.[0]?.errorCode || result?.errorCode;
    throw new ApiError(
      response.status,
      messages[code] ||
        (response.status === 403
          ? "Bạn không có quyền thực hiện thao tác này."
          : result?.errorCode === "VALIDATION_ERROR"
            ? "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập."
            : response.status === 401
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : "Không thể thực hiện yêu cầu. Vui lòng thử lại."),
      code,
    );
  }
  return result.data as T;
}

function createClient(key: string, authPath: string, expiredEvent: string) {
  let tokens: Tokens | null = readTokens();
  let refreshPromise: Promise<Tokens> | null = null;
  function isTokenPair(value: unknown): value is Tokens {
    if (!value || typeof value !== "object") return false;
    return (
      "accessToken" in value &&
      typeof value.accessToken === "string" &&
      value.accessToken.trim().length > 0 &&
      "refreshToken" in value &&
      typeof value.refreshToken === "string" &&
      value.refreshToken.trim().length > 0
    );
  }
  function readTokens(): Tokens | null {
    try {
      const value = JSON.parse(sessionStorage.getItem(key) || "null");
      if (isTokenPair(value)) return value;
      sessionStorage.removeItem(key);
      return null;
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }
  function setTokens(value: Tokens | null) {
    if (value !== null && !isTokenPair(value)) {
      throw new Error(
        "Máy chủ trả về token không hợp lệ. Vui lòng đăng nhập lại.",
      );
    }
    tokens = value;
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
  }
  function hasSession() {
    return tokens !== null;
  }
  async function login(email: string, password: string) {
    const result = await api<{ tokens: Tokens }>(`${authPath}/login`, "POST", {
      email,
      password,
    });
    setTokens(result?.tokens);
  }

  async function api<T>(
    path: string,
    method = "GET",
    body?: unknown,
    authenticated = false,
  ): Promise<T> {
    const original = tokens;
    try {
      return await request<T>(
        path,
        method,
        body,
        authenticated ? original?.accessToken : undefined,
      );
    } catch (error) {
      if (
        !authenticated ||
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        !original
      )
        throw error;
      // A concurrent request may already have rotated the token pair.
      if (tokens && tokens !== original)
        return request<T>(path, method, body, tokens.accessToken);
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const next = await request<Tokens>(
              `${authPath}/refresh-token`,
              "POST",
              { refreshToken: original.refreshToken },
            );
            if (tokens !== original)
              throw new ApiError(401, "Phiên đăng nhập đã thay đổi.");
            setTokens(next);
            return next;
          } catch (refreshError) {
            if (
              tokens === original &&
              refreshError instanceof ApiError &&
              [400, 401, 403, 404].includes(refreshError.status)
            ) {
              setTokens(null);
              window.dispatchEvent(new Event(expiredEvent));
            }
            throw refreshError;
          } finally {
            refreshPromise = null;
          }
        })();
      }
      const next = await refreshPromise;
      return request<T>(path, method, body, next.accessToken);
    }
  }

  return { api, setTokens, hasSession, login };
}
const adminClient = createClient(
  "vocalearn.admin.session",
  "/admin/auth",
  "auth-expired",
);
export const { api, setTokens, hasSession } = adminClient;
export const loginAdmin = adminClient.login;
export const userClient = createClient(
  "vocalearn.user.session",
  "/auth",
  "user-auth-expired",
);
export const userApi = userClient.api;
