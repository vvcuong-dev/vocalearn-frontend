import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserQuery } from "../useUserQuery";
import { useUserAuth } from "../auth/context";
import { Pagination } from "../components/WordSetCards";
import { DeleteAction } from "../components/DeleteAction";
import { Flashcards } from "../components/Flashcards";
import type { Word, WordSet, Page } from "../types";
export function WordSetPage() {
  const { id } = useParams();
  const { user } = useUserAuth();
  const set = useUserQuery<WordSet>(`/word-sets/${id}`);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [study, setStudy] = useState(false);
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
      <div className="mb-6 flex flex-wrap gap-3">
        <button className="secondary" onClick={() => setStudy(!study)}>
          {study ? "Ẩn flashcard" : "Ôn bằng flashcard"}
        </button>
        {owner && (
          <>
            <Link className="secondary" to={`/learn/words/new?wordSetId=${id}`}>
              Thêm từ
            </Link>
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
            {study && (
              <Flashcards
                key={`${id}:${page}:${keyword}:${words.data.items.map((w) => `${w.id}-${w.term}-${w.meaning}`).join(",")}`}
                words={words.data.items}
              />
            )}
            {!words.data.items.length && (
              <p className="p-8 text-center text-slate-500">
                Chưa có từ phù hợp. Hãy thêm từ mới hoặc thay đổi tìm kiếm.
              </p>
            )}
            <div className="space-y-4">
              {words.data.items.map((word) => (
                <article
                  key={word.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        {word.term}{" "}
                        <span className="text-sm font-normal text-teal-600">
                          {word.partOfSpeech}
                        </span>
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {word.phonetic}
                      </p>
                    </div>
                    {owner && (
                      <div className="flex gap-2">
                        <Link
                          className="secondary"
                          to={`/learn/words/${word.id}/edit`}
                        >
                          Sửa
                        </Link>
                        <DeleteAction
                          path={`/words/${word.id}`}
                          name={word.term}
                          onDeleted={changed}
                        />
                      </div>
                    )}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-slate-700">
                    {word.meaning}
                  </p>
                  {word.example && (
                    <p className="mt-3 whitespace-pre-wrap text-sm italic text-slate-500">
                      {word.example}
                    </p>
                  )}
                  {word.note && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-500">
                      Ghi chú: {word.note}
                    </p>
                  )}
                  {word.audioUrl && /^https?:\/\//.test(word.audioUrl) && (
                    <audio
                      className="mt-4 max-w-full"
                      controls
                      preload="none"
                      src={word.audioUrl}
                    >
                      Trình duyệt không hỗ trợ phát âm thanh.
                    </audio>
                  )}
                </article>
              ))}
            </div>
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
