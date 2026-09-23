import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeading } from '../../../components/ui/PageHeading'
import { QueryState } from '../../../components/ui/QueryState'
import { useApiQuery } from '../../../hooks/useApiQuery'
import {
  resources,
  type Page,
  type ResourceItem,
  type ResourceKey,
} from '../api/resources'
import { ResourceTable } from '../components/ResourceTable'
export function AdminResourcePage({ resource }: { resource: ResourceKey }) {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword') || ''
  const rawPage = Number(params.get('page') || 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const query = new URLSearchParams({
    page: String(page),
    limit: '10',
    ...(keyword ? { keyword } : {}),
  })
  const { data, error, loading, retry } = useApiQuery<Page<ResourceItem>>(
    `/admin/${resource}?${query}`,
  )
  const config = resources[resource]
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = String(new FormData(event.currentTarget).get('keyword') || '')
    setParams(search.trim() ? { keyword: search.trim() } : {})
  }
  function changePage(next: number) {
    setParams({ ...(keyword ? { keyword } : {}), page: String(next) })
  }
  return (
    <>
      <PageHeading
        title={config.title}
        description={config.description}
        action={
          <button className="secondary" onClick={retry} disabled={loading}>
            Làm mới
          </button>
        }
      />
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <form
          key={keyword}
          onSubmit={submit}
          className="flex flex-wrap items-center gap-3 p-5"
        >
          <label className="sr-only" htmlFor="resource-search">
            Tìm {config.title.toLowerCase()}
          </label>
          <input
            id="resource-search"
            className="field max-w-sm"
            name="keyword"
            defaultValue={keyword}
            placeholder={`Tìm ${config.title.toLowerCase()}…`}
          />
          <button className="secondary" type="submit">
            Tìm kiếm
          </button>
          {keyword && (
            <button
              type="button"
              className="text-link text-sm"
              onClick={() => {
                setParams({})
              }}
            >
              Xóa bộ lọc
            </button>
          )}
          <span className="ml-auto text-sm text-slate-400">
            {data
              ? `${data.pagination.totalRecord.toLocaleString('vi-VN')} kết quả`
              : ''}
          </span>
        </form>
        {loading || error ? (
          <div className="p-5">
            <QueryState loading={loading} error={error} retry={retry} />
          </div>
        ) : (
          data && (
            <>
              <ResourceTable resource={resource} items={data.items} />
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-sm">
                <p className="text-slate-500">
                  Trang {page} / {Math.max(1, data.pagination.totalPage)}
                </p>
                <div className="flex gap-2">
                  <button
                    className="secondary"
                    disabled={page <= 1}
                    onClick={() => changePage(page - 1)}
                  >
                    Trước
                  </button>
                  <button
                    className="secondary"
                    disabled={page >= data.pagination.totalPage}
                    onClick={() => changePage(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )
        )}
      </section>
    </>
  )
}
