import { ClipLoader } from "react-spinners";

export function Loading({
  label = "Đang tải dữ liệu…",
  fullPage = false,
  inline = false,
}: {
  label?: string;
  fullPage?: boolean;
  inline?: boolean;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={
        inline
          ? "inline-flex items-center justify-center gap-2"
          : `flex flex-col items-center justify-center gap-3 text-sm text-slate-500 ${fullPage ? "min-h-svh" : "p-8"}`
      }
    >
      <span aria-hidden="true">
        <ClipLoader
          size={inline ? 16 : 30}
          color={inline ? "currentColor" : "var(--color-brand, #0f766e)"}
        />
      </span>
      <span>{label}</span>
    </span>
  );
}
