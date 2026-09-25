import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { userApi } from "../../../lib/api";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserQuery } from "../useUserQuery";
import { useUserAuth } from "../auth/context";
import { WordSetCards } from "../components/WordSetCards";
import { DeleteAction } from "../components/DeleteAction";
import type { Folder, WordSet } from "../types";
export function FolderPage() {
  const { id } = useParams();
  const { user } = useUserAuth();
  const folder = useUserQuery<Folder>(`/folders/${id}`);
  const sets = useUserQuery<WordSet[]>(
    folder.data?.creatorId === user?.id ? "/me/word-sets" : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const owner = folder.data?.creatorId === user?.id;
  async function visibility() {
    if (!folder.data || busy) return;
    setBusy(true);
    setError("");
    try {
      await userApi(
        `/folders/${id}/visibility`,
        "PATCH",
        { isPublic: !folder.data.isPublic },
        true,
      );
      folder.retry();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi hiển thị.");
    } finally {
      setBusy(false);
    }
  }
  if (folder.loading || folder.error) return <QueryState {...folder} />;
  return (
    <>
      <PageHeading
        title={folder.data?.name || "Thư mục"}
        description={`${folder.data?.isPublic ? "Công khai" : "Riêng tư"}${folder.data?.isHiddenByAdmin ? " · Đang bị ẩn bởi quản trị viên" : ""}`}
        action={
          <Link to="/learn/library" className="secondary">
            Thư viện
          </Link>
        }
      />
      {owner && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            className="secondary"
            to={`/learn/word-sets/new?folderId=${id}`}
          >
            Thêm bộ từ
          </Link>
          <Link className="secondary" to={`/learn/folders/${id}/edit`}>
            Đổi tên
          </Link>
          <button className="secondary" disabled={busy} onClick={visibility}>
            {folder.data?.isPublic ? "Chuyển riêng tư" : "Công khai thư mục"}
          </button>
          <DeleteAction
            path={`/folders/${id}`}
            name={folder.data?.name || ""}
            back="/learn/library"
          />
        </div>
      )}
      {error && <QueryState error={error} />}
      {sets.loading || sets.error ? (
        <QueryState {...sets} />
      ) : (
        sets.data && (
          <WordSetCards
            items={sets.data.filter((item) => item.folder?.id === Number(id))}
          />
        )
      )}
    </>
  );
}
