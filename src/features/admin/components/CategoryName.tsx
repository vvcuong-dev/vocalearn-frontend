import { useApiQuery } from "../../../hooks/useApiQuery";

export function CategoryName({ id }: { id?: number }) {
  const { data, loading, error, retry } = useApiQuery<{ name: string }>(
    id ? `/admin/categories/${id}` : null,
  );
  if (!id) return <span>—</span>;
  if (error)
    return (
      <button
        type="button"
        onClick={retry}
        title={`${error} Nhấn để thử lại.`}
        className="text-left underline decoration-dotted underline-offset-4"
      >
        Danh mục #{id}
      </button>
    );
  return <span aria-busy={loading}>{data?.name || `Danh mục #${id}`}</span>;
}
