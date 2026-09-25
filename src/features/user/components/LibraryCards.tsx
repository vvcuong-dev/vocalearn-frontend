import { Link } from "react-router-dom";
import { Icon } from "../../../components/ui/Icon";
import type { LibraryItem } from "../types";

export function LibraryCards({ items }: { items: LibraryItem[] }) {
  return (
    <>
      {!items.length && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Chưa có nội dung phù hợp. Bạn có thể tạo thư mục hoặc bộ từ mới.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={`${item.type}:${item.data.id}`}
            to={`/learn/${item.type === "folder" ? "folders" : "word-sets"}/${item.data.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-teal-400"
          >
            <span className="inline-flex rounded-xl bg-teal-50 p-3 text-teal-700">
              <Icon name={item.type === "folder" ? "folder" : "book"} />
            </span>
            <h2 className="mt-5 text-lg font-bold">{item.data.name}</h2>
            <p className="mt-2 text-xs text-slate-500">
              {item.type === "folder"
                ? `${item.data.wordSetCount || 0} bộ từ · ${item.data.isPublic ? "Công khai" : "Riêng tư"}`
                : `${item.data.wordCount} từ vựng`}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
