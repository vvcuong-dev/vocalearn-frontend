import { Link } from "react-router-dom";
import type { LearningPath } from "../types";

export function LearningPathCard({ path }: { path: LearningPath }) {
  const difficulty = Math.min(5, Math.max(1, path.difficulty));
  const tone =
    difficulty <= 1
      ? "text-green-600 [&_progress]:accent-green-500"
      : difficulty <= 2
        ? "text-lime-600 [&_progress]:accent-lime-500"
        : difficulty <= 3
          ? "text-amber-600 [&_progress]:accent-amber-500"
          : "text-orange-600 [&_progress]:accent-orange-500";

  return (
    <Link
      to={`/learn/paths/${path.id}`}
      className="flex w-56 shrink-0 snap-start flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-amber-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
    >
      <h3 className="mb-5 min-h-10 text-sm font-bold leading-5">{path.name}</h3>
      <div
        className={`mt-auto rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 ${tone}`}
      >
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold tracking-wider text-slate-500">
            ĐỘ KHÓ
          </span>
          <span className="text-xs font-bold">{difficulty}/5</span>
        </div>
        <progress
          className="block h-2 w-full overflow-hidden rounded-full"
          value={difficulty}
          max={5}
          aria-label={`Độ khó của ${path.name}`}
        />
      </div>
    </Link>
  );
}
