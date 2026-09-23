export function QueryState({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: string;
  retry?: () => void;
}) {
  if (loading)
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"
        role="status"
      >
        Đang tải dữ liệu…
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"
      >
        <p>{error}</p>
        {retry && (
          <button
            type="button"
            className="mt-3 font-semibold underline"
            onClick={retry}
          >
            Thử lại
          </button>
        )}
      </div>
    );
  return null;
}
