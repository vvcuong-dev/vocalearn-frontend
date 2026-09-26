import { serverField } from "../../../lib/form-validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, avatarSchema, valuesToFormData } from "../../../lib/form-validation";
import { FieldError } from "../../../components/ui/FieldError";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../auth/context";
import { userApi as api } from "../../../lib/api";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
export function UserProfilePage() {
  const { user, reload } = useUserAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const profileForm = useForm({
    resolver: zodResolver(profileSchema), mode: "onTouched", reValidateMode: "onChange",
    values: { name: user?.name || "", phone: user?.phone || "" },
  });
  const avatarForm = useForm({ resolver: zodResolver(avatarSchema), mode: "onTouched" });
  async function save(values: FormData, avatar: boolean) {
    if (busy) return;
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const name = String(values.get("name") || "").trim();
      const phone = String(values.get("phone") || "").trim();
      await api(
        `/me/profile${avatar ? "/avatar" : ""}`,
        avatar ? "POST" : "PATCH",
        avatar ? values : { name, ...(phone ? { phone } : {}) },
        true,
      );
      setSuccess("Đã lưu thông tin.");
      await reload();
      if (avatar) avatarForm.reset();
    } catch (err) {
      const field = serverField(err, avatar ? ["avatar"] : ["name", "phone"]);
      if (field) {
        if (avatar) avatarForm.setError("avatar", { type: "server", message: field.message }, { shouldFocus: true });
        else profileForm.setError(field.name as "name" | "phone", { type: "server", message: field.message }, { shouldFocus: true });
        return;
      }

      setError(
        err instanceof Error ? err.message : "Không thể cập nhật tài khoản.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Tài khoản của bạn"
        description="Cập nhật thông tin cá nhân và ảnh đại diện."
      />
      {error && (
        <div className="mb-5">
          <QueryState error={error} />
        </div>
      )}
      {success && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-emerald-50 p-4 text-emerald-700"
        >
          {success}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Ảnh đại diện của bạn"
              className="mx-auto h-28 w-28 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-blue-50 text-4xl font-bold text-brand">
              {user?.name.charAt(0)}
            </div>
          )}
          <p className="mt-4 text-center font-bold">{user?.name}</p>
          <p className="mt-1 break-all text-center text-sm text-slate-500">
            {user?.email}
          </p>
          <form
            noValidate
            onSubmit={avatarForm.handleSubmit((values) => {
              const data = new FormData();
              data.set("avatar", values.avatar[0]);
              return save(data, true);
            })}
            className="mt-6 space-y-4"
          >
            <label htmlFor="avatar" className="block text-sm font-semibold">
              Đổi avatar
            </label>
            <input
              id="avatar"
              {...avatarForm.register("avatar")}
                  aria-invalid={!!avatarForm.formState.errors.avatar}
                  aria-describedby={avatarForm.formState.errors.avatar ? "avatar-error" : undefined}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={busy}
              className="w-full text-xs"
            />
                <FieldError name="avatar" message={avatarForm.formState.errors.avatar?.message} />
            <p className="text-xs text-slate-500">
              JPEG, PNG hoặc WebP · Tối đa 5 MB
            </p>
            <button className="secondary w-full" disabled={busy}>
              Tải ảnh lên
            </button>
          </form>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 font-bold">Thông tin cá nhân</h2>
          <form
            key={`${user?.name}:${user?.phone}`}
            noValidate
            onSubmit={profileForm.handleSubmit((values) => save(valuesToFormData(values), false))}
          >
            <fieldset disabled={busy} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Họ tên
                </label>
                <input
                  id="name"
                  {...profileForm.register("name")}
                  aria-invalid={!!profileForm.formState.errors.name}
                  aria-describedby={profileForm.formState.errors.name ? "name-error" : undefined}
                  className="field"
                  defaultValue={user?.name}
                  required
                  minLength={5}
                  maxLength={50}
                />
                <FieldError name="name" message={profileForm.formState.errors.name?.message} />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Số điện thoại Việt Nam
                </label>
                <input
                  id="phone"
                  {...profileForm.register("phone")}
                  aria-invalid={!!profileForm.formState.errors.phone}
                  aria-describedby={profileForm.formState.errors.phone ? "phone-error" : undefined}
                  type="tel"
                  className="field"
                  defaultValue={user?.phone || ""}
                />
                <FieldError name="phone" message={profileForm.formState.errors.phone?.message} />
                <p className="mt-2 text-xs text-slate-500">
                  Để trống để giữ nguyên số điện thoại hiện tại.
                </p>
              </div>
              <button className="primary" disabled={busy}>
                {busy ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </fieldset>
          </form>
          <div className="mt-6 flex gap-5 border-t border-slate-100 pt-5 text-sm">
            <Link className="text-link" to="/learn/change-email">
              Đổi email
            </Link>
            <Link className="text-link" to="/learn/change-password">
              Đổi mật khẩu
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
