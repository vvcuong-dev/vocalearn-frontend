import { ClipLoader } from "react-spinners";

export function Loading({
  label = "Đang tải dữ liệu…",
  fullPage = false,
}: {
  label?: string;
  fullPage?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-sm text-slate-500 ${fullPage ? "min-h-svh" : "p-8"}`}
    >
      <span aria-hidden="true">
        <ClipLoader size={30} color="var(--color-brand, #0f766e)" />
      </span>
      <span>{label}</span>
    </div>
  );
}
