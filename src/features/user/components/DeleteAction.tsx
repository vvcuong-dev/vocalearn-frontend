import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../../lib/api";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
export function DeleteAction({
  path,
  name,
  back,
  onDeleted,
}: {
  path: string;
  name: string;
  back?: string;
  onDeleted?: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await userApi(path, "DELETE", undefined, true);
      setOpen(false);
      if (back) navigate(back);
      else onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="secondary text-red-600"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Xóa
      </button>
      {open && (
        <ConfirmDialog
          title="Xóa nội dung này?"
          busy={busy}
          onCancel={() => setOpen(false)}
          onConfirm={remove}
        >
          <p>
            “{name}” sẽ bị xóa khỏi thư viện. Nếu xóa thư mục, các bộ từ bên
            trong cũng có thể không còn truy cập được.
          </p>
          {error && (
            <p role="alert" className="mt-3 text-red-600">
              {error}
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
