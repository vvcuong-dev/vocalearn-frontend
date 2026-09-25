import { Link, useSearchParams } from "react-router-dom";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { LibraryCards } from "../components/LibraryCards";
import { useUserQuery } from "../useUserQuery";
import { Pagination } from "../components/WordSetCards";
import type { LibraryItem, Page } from "../types";
export function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const number = Number(params.get("page") || 1);
  const page = Number.isSafeInteger(number) && number > 0 ? number : 1;
  const keyword = params.get("keyword") || "";
  const query = useUserQuery<Page<LibraryItem>>(
    `/me/library?${new URLSearchParams({ page: String(page), limit: "12", keyword })}`,
  );
  return (
    <>
      <PageHeading
        title="Thư viện của tôi"
        description="Sắp xếp những điều bạn muốn ghi nhớ vào từng góc nhỏ."
        action={
          <div className="flex gap-2">
            <Link className="secondary" to="/learn/folders/new">
              Tạo thư mục
            </Link>
            <Link className="secondary" to="/learn/word-sets/new">
              Tạo bộ từ
            </Link>
          </div>
        }
      />
      <form
        key={keyword}
        className="mb-6 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({
            keyword: String(
              new FormData(e.currentTarget).get("keyword") || "",
            ).trim(),
          });
        }}
      >
        <input
          name="keyword"
          defaultValue={keyword}
          placeholder="Tìm trong thư viện…"
          aria-label="Tìm trong thư viện"
          className="field max-w-sm"
        />
        <button className="secondary">Tìm kiếm</button>
      </form>
      {query.loading || query.error ? (
        <QueryState {...query} />
      ) : (
        query.data && (
          <>
            <LibraryCards items={query.data.items} />
            <Pagination
              page={page}
              totalPage={query.data.pagination.totalPage}
              onPage={(next) => setParams({ keyword, page: String(next) })}
            />
          </>
        )
      )}
    </>
  );
}
