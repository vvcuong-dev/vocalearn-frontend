import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../lib/api";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import type { ResourceItem, ResourceKey } from "../api/resources";
export function ResourceActions({
  resource,
  item,
  onChanged,
  wordSetId,
  readOnly,
}: {
  resource: ResourceKey;
  item: ResourceItem;
  onChanged: () => void;
  wordSetId?: number;
  readOnly?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const folder = resource === "folders";
  const system = resource === "roles" && item.isSystem;
  const suffix = wordSetId ? `?wordSetId=${wordSetId}` : "";
  async function mutate() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api(
        `/admin/${resource}/${item.id}${folder ? (item.isHiddenByAdmin ? "/unhide" : "/hide") : ""}`,
        folder ? "PATCH" : "DELETE",
        undefined,
        true,
      );
      setConfirm(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể thực hiện thao tác.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <Link className="text-link" to={`/admin/${resource}/${item.id}${suffix}`}>
        Chi tiết
      </Link>
      {resource === "word-sets" && (
        <Link className="text-link" to={`/admin/words?wordSetId=${item.id}`}>
          Từ vựng
        </Link>
      )}
      {resource === "roles" && (
        <Link className="text-link" to={`/admin/roles/${item.id}/permissions`}>
          Phân quyền
        </Link>
      )}
      {!system && !readOnly && (
        <button
          className={folder ? "text-link" : "font-medium text-red-600"}
          onClick={() => {
            setError("");
            setConfirm(true);
          }}
        >
          {folder ? (item.isHiddenByAdmin ? "Hiện lại" : "Ẩn") : "Xóa"}
        </button>
      )}
      {confirm && (
        <ConfirmDialog
          title={folder ? "Thay đổi hiển thị thư mục?" : "Xóa bản ghi?"}
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={mutate}
        >
          <p>
            {item.name || item.term} (#{item.id})
          </p>
          <p>
            {folder
              ? "Thao tác này thay đổi khả năng hiển thị thư mục của người học."
              : "Bản ghi sẽ bị xóa mềm khỏi danh sách. Hãy kiểm tra trước khi xác nhận."}
          </p>
          {error && (
            <p role="alert" className="mt-3 text-red-600">
              {error}
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
