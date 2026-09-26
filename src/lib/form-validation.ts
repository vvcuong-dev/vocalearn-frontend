import { z } from "zod";

export interface ValidationField {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: string[];
  relation?: string;
}
export type FormValues = Record<string, string | boolean>;
export function serverField(error: unknown, available: string[]) {
  if (!(error instanceof Error) || !("code" in error) || typeof error.code !== "string") return;
  const fields: Record<string, string[]> = {
    EMAIL_ALREADY_EXISTS: ["newEmail", "email"], EMAIL_SAME_AS_OLD: ["newEmail", "email"], EMAIL_INVALID: ["newEmail", "email"],
    OLD_PASSWORD_INCORRECT: ["oldPassword", "password"], PASSWORD_INCORRECT: ["password"],
    PASSWORD_TOO_WEAK: ["newPassword", "password"], PASSWORD_TOO_LONG: ["newPassword", "password"],
    PHONE_INVALID: ["phone"], NAME_TOO_SHORT: ["name"], NAME_TOO_LONG: ["name"],
    AVATAR_INVALID: ["avatar"], INVALID_FILE_TYPE: ["avatar"], FILE_TOO_LARGE: ["avatar"],
    ROLE_ALREADY_EXISTS: ["code"], CATEGORY_ALREADY_EXISTS: ["name"], LEARNING_PATH_DUPLICATED: ["name"],
  };
  const name = fields[error.code]?.find((field) => available.includes(field));
  return name ? { name, message: error.message } : undefined;
}
export function fieldsSchema(fields: ValidationField[]) {
  const shape: Record<string, z.ZodType<string | boolean, string | boolean>> = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      shape[field.name] = z.boolean();
      continue;
    }
    shape[field.name] = z.string().superRefine((raw, ctx) => {
      const value = field.type === "password" ? raw : raw.trim();
      const fail = (message: string) =>
        ctx.addIssue({ code: "custom", message });
      if (!value) {
        if (field.required) fail(`Vui lòng nhập ${field.label.toLowerCase()}.`);
        return;
      }
      if (field.minLength && value.length < field.minLength)
        fail(`Cần ít nhất ${field.minLength} ký tự.`);
      if (field.maxLength && value.length > field.maxLength)
        fail(`Tối đa ${field.maxLength} ký tự.`);
      if (field.type === "email" && !z.email().safeParse(value).success)
        fail("Email không hợp lệ.");
      if (
        field.type === "url" &&
        !z.url({ protocol: /^https?$/ }).safeParse(value).success
      )
        fail("Vui lòng nhập URL bắt đầu bằng http:// hoặc https://.");
      if (field.type === "number" || field.relation) {
        const n = Number(value);
        if (
          !Number.isSafeInteger(n) ||
          n < (field.min ?? 1) ||
          (field.max !== undefined && n > field.max)
        )
          fail(
            field.max
              ? `Nhập số nguyên từ ${field.min ?? 1} đến ${field.max}.`
              : "Nhập số nguyên dương.",
          );
      }
      if (field.options && !field.options.includes(value))
        fail("Giá trị không hợp lệ.");
      if (field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(value))
        fail(
          field.type === "password"
            ? "Mật khẩu cần chữ hoa, chữ thường, số và ký tự đặc biệt."
            : `${field.label} không đúng định dạng.`,
        );
    });
  }
  return z.object(shape);
}

export function authSchema(mode: string, admin = false) {
  const fields: ValidationField[] = [];
  if (["login", "register", "forgot-password", "change-email"].includes(mode))
    fields.push({
      name: admin && mode === "change-email" ? "newEmail" : "email",
      label: "Email",
      type: "email",
      required: true,
    });
  if (["login", "change-email", "change-password"].includes(mode))
    fields.push({
      name: admin && mode === "change-password" ? "oldPassword" : "password",
      label: "Mật khẩu",
      type: "password",
      required: true,
    });
  if (mode === "register")
    fields.push({
      name: "name",
      label: "Họ tên",
      required: true,
      minLength: 5,
      maxLength: 50,
    });
  const fresh = ["register", "reset-password", "change-password"].includes(
    mode,
  );
  if (fresh)
    fields.push(
      {
        name: "newPassword",
        label: "Mật khẩu mới",
        type: "password",
        required: true,
        minLength: 8,
        maxLength: 72,
        pattern: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).{8,72}",
      },
      {
        name: "confirmPassword",
        label: "Xác nhận mật khẩu",
        type: "password",
        required: true,
      },
    );
  return fieldsSchema(fields).superRefine((values, ctx) => {
    if (fresh && values.newPassword !== values.confirmPassword)
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Mật khẩu xác nhận không khớp.",
      });
  });
}

export function valuesToFormData(values: FormValues) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === true) data.set(key, "on");
    else if (value !== false) data.set(key, value);
  }
  return data;
}

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, "Họ tên cần ít nhất 5 ký tự.")
    .max(50, "Họ tên tối đa 50 ký tự."),
  phone: z.string().trim(),
});
export const avatarSchema = z.object({
  avatar: z.custom<FileList>().superRefine((files, ctx) => {
    const file = files?.[0];
    if (
      !file ||
      !file.size ||
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      ctx.addIssue({
        code: "custom",
        message: "Chọn ảnh JPEG, PNG hoặc WebP tối đa 5 MB.",
      });
  }),
});
