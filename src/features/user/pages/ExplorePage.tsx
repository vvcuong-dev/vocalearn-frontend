import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserQuery } from "../useUserQuery";
import { LearningPathCard } from "../components/LearningPathCard";
import type { PathGroup, LearningPath } from "../types";
export function ExplorePage() {
  const query = useUserQuery<PathGroup[]>(
    "/learning-paths/grouped-by-category",
  );
  const [category, setCategory] = useState("");
  return (
    <>
      <PageHeading
        title="Khám phá lộ trình"
        description="Chọn một chủ đề và bắt đầu với những từ vựng phù hợp."
      />
      {query.loading || query.error ? (
        <QueryState {...query} />
      ) : (
        <>
          <div
            className="mb-7 flex flex-wrap gap-2"
            role="group"
            aria-label="Danh mục lộ trình"
          >
            {[
              { id: "", name: "Tất cả" },
              ...(query.data || []).map((group) => ({
                id: String(group.category.id),
                name: group.category.name,
              })),
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                  category === item.id
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-[#e8dfd3] bg-white text-slate-800 hover:border-green-500"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          {!query.data?.length && (
            <p className="text-slate-500">Chưa có lộ trình được xuất bản.</p>
          )}
          {query.data
            ?.filter(
              (group) => !category || String(group.category.id) === category,
            )
            .map((group) => (
              <section
                key={group.category.id}
                className="mb-9 min-w-0"
                aria-labelledby={`category-${group.category.id}`}
              >
                <div className="mb-4 flex items-center gap-3 border-b border-[#e8dfd3] pb-3">
                  <h2
                    id={`category-${group.category.id}`}
                    className="text-lg font-bold"
                  >
                    {group.category.name}
                  </h2>
                  <span className="rounded-full bg-[#f3eee7] px-3 py-1 text-xs text-slate-500">
                    {group.totalCount} lộ trình
                  </span>
                </div>
                <div className="learning-path-row flex snap-x snap-proximity gap-3 overflow-x-auto p-1 pb-4">
                  {group.learningPaths.map((path) => (
                    <LearningPathCard key={path.id} path={path} />
                  ))}
                </div>
              </section>
            ))}
        </>
      )}
    </>
  );
}
export function LearningPathPage() {
  const { id } = useParams();
  const path = useUserQuery<LearningPath>(`/learning-paths/${id}`);
  if (path.loading || path.error) return <QueryState {...path} />;
  return (
    <>
      <PageHeading
        title={path.data?.name || "Lộ trình"}
        description={path.data?.description || ""}
        action={
          <Link to="/learn/explore" className="secondary">
            Các lộ trình
          </Link>
        }
      />
      <p className="text-sm text-slate-500">Độ khó {path.data?.difficulty}/5</p>
    </>
  );
}
