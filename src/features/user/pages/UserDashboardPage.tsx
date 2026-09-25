import { Link } from "react-router-dom";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserAuth } from "../auth/context";
import { useUserQuery } from "../useUserQuery";
import { LibraryCards } from "../components/LibraryCards";
import type { LibraryItem, Page } from "../types";
export function UserDashboardPage() {
  const { user } = useUserAuth();
  const query = useUserQuery<Page<LibraryItem>>("/me/library?page=1&limit=6");
  return (
    <>
      <PageHeading
        title={`Xin chào, ${user?.name}!`}
        description="Một chút tập trung hôm nay, thêm một bước tiến ngày mai."
      />
      <section className="mb-8 rounded-3xl bg-teal-900 p-8 text-white sm:p-10">
        <p className="text-xs font-semibold tracking-widest text-teal-200">
          SẴN SÀNG CHO MỘT TỪ MỚI?
        </p>
        <h2 className="mt-4 text-3xl font-bold">Học theo nhịp của bạn.</h2>
        <p className="mt-3 max-w-lg text-sm leading-7 text-teal-100">
          Khám phá lộ trình mới hoặc trở lại thư viện để ôn những từ bạn đã lưu.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/learn/explore"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-900"
          >
            Khám phá lộ trình
          </Link>
          <Link
            to="/learn/word-sets/new"
            className="rounded-xl border border-teal-500 px-5 py-3 text-sm font-bold"
          >
            Tạo bộ từ của tôi
          </Link>
        </div>
      </section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Thư viện của bạn</h2>
        <Link className="text-link text-sm" to="/learn/library">
          Xem tất cả
        </Link>
      </div>
      {query.loading || query.error ? (
        <QueryState {...query} />
      ) : (
        <LibraryCards items={query.data?.items || []} />
      )}
    </>
  );
}
