import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserQuery } from "../useUserQuery";
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
          <label htmlFor="category" className="sr-only">
            Danh mục
          </label>
          <select
            id="category"
            className="field mb-6 max-w-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {query.data?.map((group) => (
              <option key={group.category.id} value={group.category.id}>
                {group.category.name}
              </option>
            ))}
          </select>
          {!query.data?.length && (
            <p className="text-slate-500">Chưa có lộ trình được xuất bản.</p>
          )}
          {query.data
            ?.filter(
              (group) => !category || String(group.category.id) === category,
            )
            .map((group) => (
              <section key={group.category.id} className="mb-9">
                <h2 className="mb-4 text-xl font-bold">
                  {group.category.name}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {group.learningPaths.map((path) => (
                    <Link
                      key={path.id}
                      to={`/learn/paths/${path.id}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-teal-400"
                    >
                      {path.thumbnail ? (
                        <img
                          src={path.thumbnail}
                          alt=""
                          className="h-36 w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-36 place-items-center bg-teal-50 text-5xl font-bold text-teal-200">
                          Aa
                        </div>
                      )}
                      <div className="p-5">
                        <p className="mb-2 text-xs text-teal-700">
                          Độ khó {path.difficulty}/5
                        </p>
                        <h3 className="font-bold">{path.name}</h3>
                      </div>
                    </Link>
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
