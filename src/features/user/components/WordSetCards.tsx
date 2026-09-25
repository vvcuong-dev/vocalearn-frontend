import { Link } from "react-router-dom";
import { Icon } from "../../../components/ui/Icon";
import type { WordSet } from "../types";
export function WordSetCards({ items }: { items: WordSet[] }) {
  if (!items.length)
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
        Chưa có bộ từ nào. Hãy thử tạo một bộ từ mới hoặc khám phá lộ trình
        khác.
      </p>
    );
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/learn/word-sets/${item.id}`}
          className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <Icon name="book" />
            </span>
            {item.isPro && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                Pro
              </span>
            )}
          </div>
          <h2 className="mt-5 text-lg font-bold">{item.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {item.description || "Thêm từng từ, tích lũy từng ngày."}
          </p>
          <p className="mt-5 text-xs font-semibold text-teal-700">
            {item.wordCount} từ vựng ·{" "}
            {item.creator ? item.creator.fullName : "Bộ từ chính thức"}
          </p>
        </Link>
      ))}
    </div>
  );
}
export function Pagination({
  page,
  totalPage,
  onPage,
}: {
  page: number;
  totalPage: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-4 text-sm">
      <button
        className="secondary"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Trước
      </button>
      <span>
        {page} / {Math.max(1, totalPage)}
      </span>
      <button
        className="secondary"
        disabled={page >= totalPage}
        onClick={() => onPage(page + 1)}
      >
        Sau
      </button>
    </div>
  );
}
