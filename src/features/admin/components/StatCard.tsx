import { Link } from 'react-router-dom'
import { Icon } from '../../../components/ui/Icon'
import { useApiQuery } from '../../../hooks/useApiQuery'
import {
  resources,
  type Page,
  type ResourceItem,
  type ResourceKey,
} from '../api/resources'
export function StatCard({ resource }: { resource: ResourceKey }) {
  const config = resources[resource]
  const { data, loading, error, retry } = useApiQuery<Page<ResourceItem>>(
    `/admin/${resource}?page=1&limit=1`,
  )
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-500">{config.title}</p>
          <p
            className="mt-3 text-3xl font-bold tabular-nums"
            aria-live="polite"
          >
            {loading
              ? '…'
              : data
                ? data.pagination.totalRecord.toLocaleString('vi-VN')
                : '—'}
          </p>
        </div>
        <span className={`rounded-2xl p-3 ${config.color}`}>
          <Icon name={config.icon} className="h-6 w-6" />
        </span>
      </div>
      {error ? (
        <div className="mt-4 text-xs text-red-600" role="alert">
          <p>{error}</p>
          <button className="mt-2 underline" onClick={retry}>
            Thử lại
          </button>
        </div>
      ) : (
        <Link
          className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-brand"
          to={`/admin/${resource}`}
        >
          Xem danh sách <Icon name="arrow" className="h-4 w-4" />
        </Link>
      )}
    </section>
  )
}
