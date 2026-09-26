import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../src/features/admin/auth/AuthProvider";
import { UserAuthProvider } from "../src/features/user/auth/UserAuthProvider";
import { useAuth } from "../src/features/admin/auth/context";
import { useUserAuth } from "../src/features/user/auth/context";
import { AdminAuthForm } from "../src/features/admin/auth/AdminAuthForm";
import { AuthContext } from "../src/features/admin/auth/context";
import { MemoryRouter } from "react-router-dom";
import { act } from "react";
import { AdminAuthPage } from "../src/features/admin/pages/AdminAuthPage";
import { Routes, Route } from "react-router-dom";

const mock = vi.hoisted(() => ({
  session: false,
  profile: vi.fn(),
  login: vi.fn(),
  clear: vi.fn(),
}));
vi.mock("../src/lib/api", () => ({
  api: mock.profile,
  userApi: mock.profile,
  loginAdmin: mock.login,
  hasSession: () => mock.session,
  restoreSession: async () => mock.session,
  logoutAdmin: vi.fn(),
  getSessionVersion: () => 0,
  setTokens: mock.clear,
  userClient: {
    login: mock.login,
    hasSession: () => mock.session,
    restoreSession: async () => mock.session,
    logout: vi.fn(),
    getSessionVersion: () => 0,
    setTokens: mock.clear,
  },
  ApiError: class extends Error {},
}));

function AdminLogin() {
  const { admin, login } = useAuth();
  return (
    <button
      onClick={() =>
        void login("admin@example.com", "Pass@123").catch(() => {})
      }
    >
      {admin ? admin.name : "Login"}
    </button>
  );
}
function UserLogin() {
  const { user, login } = useUserAuth();
  return (
    <button
      onClick={() =>
        void login("user@example.com", "Pass@123", true).catch(() => {})
      }
    >
      {user ? user.name : "Login"}
    </button>
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mock.session = false;
  mock.login.mockImplementation(async () => {
    mock.session = true;
  });
  mock.clear.mockImplementation(() => {
    mock.session = false;
  });
});
afterEach(cleanup);

test("opening admin login with a restored session redirects to the dashboard", async () => {
  mock.session = true;
  mock.profile.mockResolvedValue({ id: 1, name: "Admin" });
  render(
    <MemoryRouter initialEntries={["/admin/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminAuthPage mode="login" />} />
          <Route path="/admin" element={<h1>Admin dashboard</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("heading", { name: "Admin dashboard" }),
  ).toBeTruthy();
  expect(mock.login).not.toHaveBeenCalled();
});

test("admin login shows a spinner while waiting and disables duplicate submissions", async () => {
  const user = userEvent.setup();
  let finish!: () => void;
  const login = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{ admin: null, login, logout: vi.fn(), reload: vi.fn() }}
      >
        <AdminAuthForm mode="login" />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText("Email"), "admin@example.com");
  await user.type(
    screen.getByLabelText("Mật khẩu", { exact: true }),
    "Pass@123",
  );
  await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Đang đăng nhập…",
  );
  expect(
    screen.getByRole("button", { name: "Đang đăng nhập…" }),
  ).toHaveProperty("disabled", true);
  expect(login).toHaveBeenCalledTimes(1);
  await act(async () => finish());
});

for (const [name, Provider, Child] of [
  ["admin", AuthProvider, AdminLogin],
  ["user", UserAuthProvider, UserLogin],
] as const) {
  test(`${name} preserves login tokens after profile failure and retries profile without another login`, async () => {
    const user = userEvent.setup();
    mock.profile.mockRejectedValueOnce(
      new Error("Profile temporarily unavailable"),
    );
    render(
      <Provider>
        <Child />
      </Provider>,
    );
    await user.click(await screen.findByRole("button", { name: "Login" }));
    await waitFor(() => expect(mock.profile).toHaveBeenCalled());
    expect(mock.clear).not.toHaveBeenCalled();
    expect(mock.session).toBe(true);
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Profile temporarily unavailable",
    );
    mock.profile.mockResolvedValue({ id: 1, name: "Learner" });
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("button", { name: "Learner" })).toBeTruthy();
    expect(mock.login).toHaveBeenCalledTimes(1);
  });
}
