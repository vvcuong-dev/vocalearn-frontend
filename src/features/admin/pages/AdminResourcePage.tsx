import type { FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
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
import { ResourceActions } from '../components/ResourceActions'
export function AdminResourcePage({ resource }: { resource: ResourceKey }) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const wordSetId = Number(params.get('wordSetId'))
  const validWordSet = Number.isSafeInteger(wordSetId) && wordSetId > 0
  const parent = useApiQuery<ResourceItem>(
    resource === 'words' && validWordSet
      ? `/admin/word-sets/${wordSetId}`
      : null,
  )
  const readonlyWords =
    resource === 'words' && (!parent.data || !!parent.data.creator)
  const keyword = params.get('keyword') || ''
  const rawPage = Number(params.get('page') || 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const query = new URLSearchParams({
    page: String(page),
    limit: '10',
    ...(resource === 'words' && validWordSet
      ? { wordSetId: String(wordSetId) }
      : {}),
    ...(keyword ? { keyword } : {}),
  })
  const { data, error, loading, retry } = useApiQuery<Page<ResourceItem>>(
    resource === 'words' && !validWordSet
      ? null
      : `/admin/${resource}?${query}`,
  )
  const config = resources[resource]
  const extra: Record<string, string> =
    resource === 'words' && validWordSet ? { wordSetId: String(wordSetId) } : {}
  if (resource === 'words' && !validWordSet)
    return (
      <>
        <PageHeading
          title="Từ vựng"
          description="Chọn một bộ từ để quản lý từ vựng."
        />
        <Link to="/admin/word-sets" className="text-link">
          Đến danh sách bộ từ
        </Link>
      </>
    )
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = String(
      new FormData(event.currentTarget).get('keyword') || '',
    )
    setParams({
      ...extra,
      ...(search.trim() ? { keyword: search.trim() } : {}),
    })
  }
  function changePage(next: number) {
    setParams({ ...extra, ...(keyword ? { keyword } : {}), page: String(next) })
  }
  return (
    <>
      <PageHeading
        title={config.title}
        description={
          resource === 'words'
            ? `Bộ từ: ${parent.data?.name || `#${wordSetId}`}`
            : config.description
        }
        action={
          <div className="flex gap-3">
            {resource !== 'folders' && !readonlyWords && (
              <Link
                className="secondary text-blue-600"
                to={`/admin/${resource}/new${resource === 'words' ? `?wordSetId=${wordSetId}` : ''}`}
              >
                Thêm mới
              </Link>
            )}
            <button className="secondary" onClick={retry} disabled={loading}>
              Làm mới
            </button>
          </div>
        }
      />
      {location.state?.notice && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-emerald-50 p-4 text-emerald-700"
        >
          {location.state.notice}
        </p>
      )}
      {resource === 'words' && (
        <div className="mb-5">
          <Link to="/admin/word-sets" className="text-link text-sm">
            Về danh sách bộ từ
          </Link>
          <QueryState
            loading={parent.loading}
            error={parent.error}
            retry={parent.retry}
          />
          {parent.data?.creator && (
            <p className="mt-3 text-sm text-slate-500">
              Bộ từ cá nhân: chỉ xem từ vựng.
            </p>
          )}
        </div>
      )}
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
                setParams(extra)
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
              <ResourceTable
                resource={resource}
                items={data.items}
                renderActions={(item) => (
                  <ResourceActions
                    resource={resource}
                    item={item}
                    wordSetId={resource === 'words' ? wordSetId : undefined}
                    readOnly={readonlyWords}
                    onChanged={() => {
                      if (data.items.length === 1 && page > 1)
                        changePage(page - 1)
                      else retry()
                    }}
                  />
                )}
              />
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
