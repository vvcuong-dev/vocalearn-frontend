import type { UseFormRegisterReturn } from "react-hook-form";
import { FieldError } from "../../../components/ui/FieldError";
import { useState } from "react";
import { useApiQuery } from "../../../hooks/useApiQuery";
import type { Page, ResourceItem, ResourceKey } from "../api/resources";
import { QueryState } from "../../../components/ui/QueryState";
export function RelationSelect({
  name,
  label,
  resource,
  initial,
  registration,
  validationError,
}: {
  name: string;
  label: string;
  resource: ResourceKey;
  initial?: number;
  registration: UseFormRegisterReturn;
  validationError?: string;
}) {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(String(initial || ""));
  const { data, loading, error, retry } = useApiQuery<Page<ResourceItem>>(
    `/admin/${resource}?${new URLSearchParams({ page: String(page), limit: "20", keyword })}`,
  );
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label} *
      </label>
      <input
        className="field"
        aria-label={`Tìm ${label.toLowerCase()}`}
        placeholder="Nhập tên để tìm…"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(1);
        }}
      />
      <select
        required
        id={name}
        {...registration}
        aria-invalid={!!validationError}
        aria-describedby={validationError ? `${name}-error` : undefined}
        value={selected}
        onChange={(e) => { setSelected(e.target.value); void registration.onChange(e); }}
        className="field"
      >
        <option value="">Chọn {label.toLowerCase()}</option>
        {selected &&
          !data?.items.some((item) => String(item.id) === selected) && (
            <option value={selected}>Đang chọn #{selected}</option>
          )}
        {data?.items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} (#{item.id})
          </option>
        ))}
      </select>
      <FieldError name={name} message={validationError} />
      <QueryState loading={loading} error={error} retry={retry} />
      {data && data.pagination.totalPage > 1 && (
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            className="text-link"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </button>
          <span>
            {page} / {data.pagination.totalPage}
          </span>
          <button
            type="button"
            className="text-link"
            disabled={page >= data.pagination.totalPage}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
