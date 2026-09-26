export interface Tokens {
  accessToken: string;
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
      credentials: "include",
      headers: {
        "X-CSRF-Protection": "1",
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
  // Remove legacy browser storage; refresh credentials now belong to HttpOnly cookies.
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      window[storage].removeItem(key);
    } catch {
      /* Storage may be disabled. */
    }
  }
  let tokens: Tokens | null = null;
  let sessionVersion = 0;
  let refreshPromise: Promise<Tokens> | null = null;
  const channel =
    typeof window !== "undefined" && "BroadcastChannel" in window
      ? new window.BroadcastChannel(key)
      : null;
  function setTokens(value: Tokens | null) {
    if (
      value !== null &&
      (!value ||
        typeof value.accessToken !== "string" ||
        !value.accessToken.trim())
    )
      throw new Error("Invalid access token response");
    tokens = value;
    sessionVersion++;
  }
  if (channel)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data !== "logout" && event.data !== "login") return;
      setTokens(null);
      window.dispatchEvent(
        new Event(
          event.data === "logout" ? expiredEvent : `${expiredEvent}-changed`,
        ),
      );
    };
  function hasSession() {
    return tokens !== null;
  }
  function locked<T>(action: () => Promise<T>) {
    return typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request(`${key}.cookie`, action)
      : action();
  }
  function refresh(): Promise<Tokens> {
    if (refreshPromise) return refreshPromise;
    const version = sessionVersion;
    const pending = locked(async () => {
      if (version !== sessionVersion)
        throw new ApiError(409, "Session changed");
      try {
        const next = await request<Tokens>(`${authPath}/refresh-token`, "POST");
        if (version !== sessionVersion)
          throw new ApiError(409, "Session changed");
        if (
          !next ||
          typeof next.accessToken !== "string" ||
          !next.accessToken.trim()
        )
          throw new Error("Invalid access token response");
        tokens = { accessToken: next.accessToken };
        return tokens;
      } catch (error) {
        if (
          version === sessionVersion &&
          error instanceof ApiError &&
          error.status === 401
        ) {
          setTokens(null);
          window.dispatchEvent(new Event(expiredEvent));
        }
        throw error;
      }
    });
    const shared = pending.finally(() => {
      if (refreshPromise === shared) refreshPromise = null;
    });
    refreshPromise = shared;
    return shared;
  }
  async function restoreSession() {
    if (tokens) return true;
    try {
      await refresh();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return false;
      throw error;
    }
  }
  async function login(email: string, password: string, remember = true) {
    await locked(async () => {
      const result = await request<Tokens>(`${authPath}/login`, "POST", {
        email,
        password,
        remember,
      });
      if (!result) throw new Error("Invalid access token response");
      setTokens(result);
      channel?.postMessage("login");
    });
  }
  async function logout() {
    await locked(async () => {
      await request(
        `${authPath}/logout`,
        "POST",
        undefined,
        tokens?.accessToken,
      );
      setTokens(null);
      channel?.postMessage("logout");
      window.dispatchEvent(new Event(expiredEvent));
    });
  }
  async function api<T>(
    path: string,
    method = "GET",
    body?: unknown,
    authenticated = false,
  ): Promise<T> {
    const original = tokens;
    const version = sessionVersion;
    const check = () => {
      if (authenticated && version !== sessionVersion)
        throw new ApiError(409, "Session changed");
    };
    try {
      const result = await request<T>(
        path,
        method,
        body,
        authenticated ? original?.accessToken : undefined,
      );
      check();
      return result;
    } catch (error) {
      if (
        !authenticated ||
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        version !== sessionVersion
      )
        throw error;
      const next = tokens && tokens !== original ? tokens : await refresh();
      check();
      const result = await request<T>(path, method, body, next.accessToken);
      check();
      return result;
    }
  }
  return {
    api,
    setTokens,
    hasSession,
    login,
    logout,
    restoreSession,
    getSessionVersion: () => sessionVersion,
  };
}
const adminClient = createClient(
  "vocalearn.admin.session",
  "/admin/auth",
  "auth-expired",
);
export const { api, setTokens, hasSession, getSessionVersion, restoreSession } =
  adminClient;
export const loginAdmin = adminClient.login;
export const logoutAdmin = adminClient.logout;
export const userClient = createClient(
  "vocalearn.user.session",
  "/auth",
  "user-auth-expired",
);
export const userApi = userClient.api;
