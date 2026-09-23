import { useEffect, useRef, type ReactNode } from "react";
export function ConfirmDialog({
  title,
  children,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-900/40"
      aria-labelledby="confirm-title"
    >
      <h2 id="confirm-title" className="text-lg font-bold">
        {title}
      </h2>
      <div className="my-5 text-sm leading-6 text-slate-600">{children}</div>
      <div className="flex justify-end gap-3">
        <button
          className="secondary"
          autoFocus
          disabled={busy}
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          className="secondary text-red-600"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Đang xử lý…" : "Xác nhận"}
        </button>
      </div>
    </dialog>
  );
}
