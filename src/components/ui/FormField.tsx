import { useFormContext, useFormState } from "react-hook-form";
import { FieldError } from "./FieldError";
import { useState } from "react";
export function FormField({
  name,
  label,
  type = "text",
  fresh = false,
}: {
  name: string;
  label: string;
  type?: string;
  fresh?: boolean;
}) {
  const { register, control } = useFormContext();
  const { errors } = useFormState({ control, name });
  const message = errors[name]?.message as string | undefined;
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <input
          className={`field ${type === "password" ? "pr-20" : ""}`}
          id={name}
          {...register(name, {
            deps: name === "newPassword" ? ["confirmPassword"] : undefined,
          })}
          aria-invalid={!!message}
          aria-describedby={message ? `${name}-error` : undefined}
          type={show ? "text" : type}
          required
          autoComplete={
            type === "password"
              ? fresh
                ? "new-password"
                : "current-password"
              : type === "email"
                ? "email"
                : "name"
          }
          maxLength={type === "password" ? 72 : undefined}
          minLength={fresh ? 8 : undefined}
        />
        {type === "password" && (
          <button
            type="button"
            className="absolute inset-y-0 right-3 text-sm text-blue-600"
            aria-label={show ? `Ẩn ${label}` : `Hiện ${label}`}
            aria-pressed={show}
            onClick={() => setShow(!show)}
          >
            {show ? "Ẩn" : "Hiện"}
          </button>
        )}
      </div>
      <FieldError name={name} message={message} />
    </div>
  );
}
