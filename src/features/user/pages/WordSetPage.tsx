import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserQuery } from "../useUserQuery";
import { useUserAuth } from "../auth/context";
import { Pagination } from "../components/WordSetCards";
import { DeleteAction } from "../components/DeleteAction";
import { BulkWordDialog } from "../components/BulkWordDialog";
import { WordTable } from "../components/WordTable";
import type { Word, WordSet, Page } from "../types";
export function WordSetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const set = useUserQuery<WordSet>(`/word-sets/${id}`);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [adding, setAdding] = useState(false);
  const words = useUserQuery<Page<Word>>(
    set.data
      ? `/words?${new URLSearchParams({ wordSetId: id || "", page: String(page), limit: "20", keyword })}`
      : null,
  );
  const owner =
    !!user && set.data?.creator?.id === user.id && !set.data?.learningPath;
  if (set.loading || set.error) return <QueryState {...set} />;
  function changed() {
    if (words.data?.items.length === 1 && page > 1) setPage(page - 1);
    else words.retry();
    set.retry();
  }
  return (
    <>
      <PageHeading
        title={set.data?.name || "Bộ từ vựng"}
        description={
          set.data?.description ||
          `${set.data?.wordCount || 0} từ · ${owner ? "Bộ từ của bạn" : "Chỉ xem"}`
        }
        action={
          <Link
            to={
              set.data?.folder
                ? `/learn/folders/${set.data.folder.id}`
                : "/learn/library"
            }
            className="secondary"
          >
            Về thư viện
          </Link>
        }
      />
      <div className="vocabulary-summary mb-6">
        <div>
          <span>TỪ TRONG BỘ</span>
          <strong>{set.data?.wordCount || 0}</strong>
        </div>
        <div>
          <span>QUYỀN TRUY CẬP</span>
          <strong className="text-lg!">
            {owner ? "Bộ từ của tôi" : "Chỉ xem"}
          </strong>
        </div>
      </div>
      {adding && set.data && (
        <BulkWordDialog
          wordSetId={Number(id)}
          name={set.data.name}
          onClose={() => setAdding(false)}
          onSaved={(target) => {
            setAdding(false);
            words.retry();
            set.retry();
            if (target !== Number(id)) navigate(`/learn/word-sets/${target}`);
          }}
        />
      )}
      <div className="mb-6 flex flex-wrap gap-3">
        {owner && (
          <>
            <button className="primary w-auto!" onClick={() => setAdding(true)}>
              + Thêm nhiều từ
            </button>
            <Link className="secondary" to={`/learn/word-sets/${id}/edit`}>
              Sửa bộ từ
            </Link>
            <DeleteAction
              path={`/word-sets/${id}`}
              name={set.data?.name || ""}
              back="/learn/library"
            />
          </>
        )}
      </div>
      <form
        className="mb-6 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(
            String(new FormData(e.currentTarget).get("keyword") || "").trim(),
          );
          setPage(1);
        }}
      >
        <input
          className="field max-w-sm"
          name="keyword"
          placeholder="Tìm từ vựng…"
          aria-label="Tìm từ vựng"
        />
        <button className="secondary">Tìm</button>
      </form>
      {words.loading || words.error ? (
        <QueryState {...words} />
      ) : (
        words.data && (
          <>
            <WordTable
              words={words.data.items}
              editable={owner}
              onDeleted={changed}
            />
            <Pagination
              page={page}
              totalPage={words.data.pagination.totalPage}
              onPage={setPage}
            />
          </>
        )
      )}
    </>
  );
}
