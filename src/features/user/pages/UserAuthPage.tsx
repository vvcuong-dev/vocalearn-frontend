import { serverField } from "../../../lib/form-validation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, type FormValues } from "../../../lib/form-validation";
import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { userApi } from "../../../lib/api";
import { FormField } from "../../../components/ui/FormField";
import { useUserAuth } from "../auth/context";
export type UserAuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "change-password"
  | "change-email";
const titles: Record<UserAuthMode, string> = {
  login: "Chào mừng bạn trở lại",
  register: "Bắt đầu cùng VocaLearn",
  "forgot-password": "Quên mật khẩu?",
  "reset-password": "Tạo mật khẩu mới",
  "change-password": "Đổi mật khẩu",
  "change-email": "Đổi email",
};
export function UserAuthPage({ mode }: { mode: UserAuthMode }) {
  const { user, login, reload } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from: unknown = location.state?.from;
  const destination =
    typeof from === "string" &&
    (from === "/learn" || from.startsWith("/learn/"))
      ? from
      : "/learn";
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = params.get("token") || "";
  const methods = useForm<FormValues>({
    resolver: zodResolver(authSchema(mode, false)),
    mode: mode === "login" ? "onSubmit" : "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      newEmail: "",
      password: "",
      oldPassword: "",
      name: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const newPassword = [
    "register",
    "reset-password",
    "change-password",
  ].includes(mode);
  if (user && ["login", "register"].includes(mode))
    return <Navigate to={destination} replace />;
  async function submit(data: FormValues) {
    if (busy) return;
    const values = data as Record<string, string>;
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(values.email.trim(), values.password, remember);
        navigate(destination, { replace: true });
        return;
      }
      if (mode === "register") {
        await userApi("/auth/register", "POST", {
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.newPassword,
        });
        setSuccess("Đăng ký thành công! Hãy đăng nhập để bắt đầu.");
        methods.reset();
        return;
      }
      if (mode === "forgot-password") {
        await userApi("/auth/forgot-password", "POST", {
          email: values.email.trim(),
        });
        setSuccess(
          "Nếu email đã đăng ký, link đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.",
        );
      }
      if (mode === "reset-password") {
        await userApi("/auth/reset-password", "POST", {
          token,
          newPassword: values.newPassword,
        });
        setSuccess("Đã đặt lại mật khẩu. Hãy đăng nhập với mật khẩu mới.");
      }
      if (mode === "change-password") {
        await userApi(
          "/auth/change-password",
          "PATCH",
          { oldPassword: values.password, newPassword: values.newPassword },
          true,
        );
        setSuccess("Đã đổi mật khẩu.");
      }
      if (mode === "change-email") {
        await userApi(
          "/auth/change-email",
          "PATCH",
          { password: values.password, newEmail: values.email.trim() },
          true,
        );
        setSuccess("Đã đổi email đăng nhập.");
        await reload();
      }
      methods.reset();
    } catch (err) {
      const field = serverField(
        err,
        Object.keys(authSchema(mode, false).shape),
      );
      if (field) {
        methods.setError(
          field.name,
          { type: "server", message: field.message },
          { shouldFocus: true },
        );
        return;
      }

      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="mb-3 text-xs font-bold tracking-widest text-teal-700">
          GÓC HỌC TẬP CỦA BẠN
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{titles[mode]}</h1>
        <p className="mb-7 mt-3 text-sm leading-6 text-slate-500">
          Mỗi từ mới là một cơ hội để hiểu thêm thế giới.
        </p>
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-teal-50 p-3 text-sm text-teal-800"
          >
            {success}
          </p>
        )}
        {mode === "reset-password" && !token ? (
          <p role="alert">Link thiếu token. Vui lòng yêu cầu link mới.</p>
        ) : (
          !(success && ["reset-password", "register"].includes(mode)) && (
            <FormProvider {...methods}>
              <form noValidate onSubmit={methods.handleSubmit(submit)}>
                <fieldset disabled={busy} className="space-y-5">
                  {mode === "register" && (
                    <FormField name="name" label="Họ tên" />
                  )}
                  {[
                    "login",
                    "register",
                    "forgot-password",
                    "change-email",
                  ].includes(mode) && (
                    <FormField
                      name="email"
                      label={mode === "change-email" ? "Email mới" : "Email"}
                      type="email"
                    />
                  )}
                  {["login", "change-password", "change-email"].includes(
                    mode,
                  ) && (
                    <FormField
                      name="password"
                      label="Mật khẩu hiện tại"
                      type="password"
                    />
                  )}
                  {newPassword && (
                    <>
                      <FormField
                        name="newPassword"
                        label="Mật khẩu mới"
                        type="password"
                        fresh
                      />
                      <p className="text-xs leading-5 text-slate-500">
                        8–72 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc
                        biệt.
                      </p>
                      <FormField
                        name="confirmPassword"
                        label="Xác nhận mật khẩu"
                        type="password"
                        fresh
                      />
                    </>
                  )}
                  {mode === "login" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="h-4 w-4 accent-teal-700"
                      />
                      Ghi nhớ đăng nhập trên thiết bị này
                    </label>
                  )}
                  {mode === "login" && (
                    <Link
                      to="/forgot-password"
                      className="text-link block text-right text-sm"
                    >
                      Quên mật khẩu?
                    </Link>
                  )}
                  <button className="primary" disabled={busy}>
                    {busy
                      ? "Đang xử lý…"
                      : mode === "login"
                        ? "Đăng nhập"
                        : mode === "register"
                          ? "Tạo tài khoản"
                          : "Xác nhận"}
                  </button>
                </fieldset>
              </form>
            </FormProvider>
          )
        )}
        {!mode.startsWith("change") && (
          <div className="mt-6 space-y-3 text-center text-sm">
            <Link
              className="text-link block"
              to={mode === "login" ? "/register" : "/login"}
            >
              {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Về đăng nhập"}
            </Link>
            {mode === "reset-password" && (
              <Link to="/forgot-password" className="text-link block">
                Yêu cầu link mới
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
