import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserQuery } from "../useUserQuery";
import { BulkWordDialog } from "../components/BulkWordDialog";
import { WordTable } from "../components/WordTable";
import { Pagination } from "../components/WordSetCards";
import type { Page, Word, WordSet } from "../types";

export function VocabularyPage({ add = false }: { add?: boolean }) {
  const sets = useUserQuery<WordSet[]>("/me/word-sets");
  const [params, setParams] = useSearchParams();
  const selected =
    sets.data?.find((set) => set.id === Number(params.get("wordSetId"))) ||
    sets.data?.[0];
  const [adding, setAdding] = useState(add);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const words = useUserQuery<Page<Word>>(
    selected
      ? `/words?${new URLSearchParams({ wordSetId: String(selected.id), page: String(page), limit: "20", keyword })}`
      : null,
  );
  function changed() {
    if (words.data?.items.length === 1 && page > 1) setPage(page - 1);
    else words.retry();
    sets.retry();
  }
  return (
    <>
      <PageHeading
        title="Từ vựng của tôi"
        description="Từng từ nhỏ, một kho kiến thức lớn. Quản lý từ vựng theo bộ từ của bạn."
        action={
          <Link className="secondary" to="/learn/library">
            Bộ từ vựng
          </Link>
        }
      />
      {sets.loading || sets.error ? (
        <QueryState {...sets} />
      ) : !sets.data?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <h2 className="text-xl font-bold">Bắt đầu với bộ từ đầu tiên</h2>
          <p className="my-4 text-slate-500">
            Tạo một bộ từ để lưu từ vựng, ví dụ và ghi chú của bạn.
          </p>
          <Link className="secondary" to="/learn/word-sets/new">
            + Tạo bộ từ
          </Link>
        </div>
      ) : (
        <>
          <div className="vocabulary-summary mb-6">
            <div>
              <span>TỔNG TỪ VỰNG</span>
              <strong>
                {sets.data.reduce((sum, set) => sum + set.wordCount, 0)}
              </strong>
            </div>
            <div>
              <span>BỘ TỪ CỦA TÔI</span>
              <strong>{sets.data.length}</strong>
            </div>
            <div>
              <span>TỪ TRONG BỘ ĐANG CHỌN</span>
              <strong>{selected?.wordCount || 0}</strong>
            </div>
          </div>
          <form
            className="vocabulary-toolbar mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              setKeyword(
                String(
                  new FormData(event.currentTarget).get("keyword") || "",
                ).trim(),
              );
              setPage(1);
            }}
          >
            <input
              className="field w-auto! grow"
              name="keyword"
              placeholder="Tìm từ trong bộ đang chọn…"
              aria-label="Tìm từ vựng"
            />
            <select
              className="field max-w-full"
              aria-label="Chọn bộ từ"
              title={selected?.name}
              value={selected?.id || ""}
              onChange={(event) => {
                setParams({ wordSetId: event.target.value });
                setPage(1);
              }}
            >
              {sets.data.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
            <button className="secondary">Tìm kiếm</button>
            <button
              type="button"
              className="primary w-auto!"
              onClick={() => setAdding(true)}
            >
              + Thêm nhiều từ
            </button>
          </form>
          {words.loading || words.error ? (
            <QueryState {...words} />
          ) : (
            <>
              <WordTable
                words={words.data?.items || []}
                editable
                onDeleted={changed}
              />
              <Pagination
                page={page}
                totalPage={words.data?.pagination.totalPage || 1}
                onPage={setPage}
              />
            </>
          )}
          {adding && selected && (
            <BulkWordDialog
              wordSetId={selected.id}
              name={selected.name}
              onClose={() => setAdding(false)}
              onSaved={(target) => {
                setAdding(false);
                setParams({ wordSetId: String(target) });
                setPage(1);
                words.retry();
                sets.retry();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
