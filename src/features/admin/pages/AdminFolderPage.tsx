import { Link, useParams } from 'react-router-dom'
import { useApiQuery } from '../../../hooks/useApiQuery'
import { PageHeading } from '../../../components/ui/PageHeading'
import { QueryState } from '../../../components/ui/QueryState'
import { ResourceActions } from '../components/ResourceActions'
import { ResourceTable } from '../components/ResourceTable'
import type { Page, ResourceItem } from '../api/resources'
import { useState } from 'react'
export function AdminFolderPage() {
  const { id } = useParams()
  const [page, setPage] = useState(1)
  const folder = useApiQuery<ResourceItem>(`/admin/folders/${id}`)
  const sets = useApiQuery<Page<ResourceItem>>(
    `/admin/word-sets?folderId=${id}&page=${page}&limit=10`,
  )
  if (folder.loading || folder.error) return <QueryState {...folder} />
  return (
    <>
      <PageHeading
        title={folder.data?.name || 'Thư mục'}
        description={`Thư mục #${id} · Người tạo #${folder.data?.creatorId}`}
        action={
          <Link to="/admin/folders" className="secondary">
            Về danh sách
          </Link>
        }
      />
      {folder.data && (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm">
            {folder.data.isPublic ? 'Công khai' : 'Riêng tư'} ·{' '}
            {folder.data.isHiddenByAdmin ? 'Đã bị ẩn bởi admin' : 'Không bị ẩn'}
          </p>
          <ResourceActions
            resource="folders"
            item={folder.data}
            onChanged={folder.retry}
          />
        </section>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="p-6 font-bold">Bộ từ trong thư mục</h2>
        {sets.loading || sets.error ? (
          <QueryState {...sets} />
        ) : (
          sets.data && (
            <>
              <ResourceTable
                resource="word-sets"
                items={sets.data.items}
                renderActions={(item) => (
                  <Link
                    className="text-link"
                    to={`/admin/words?wordSetId=${item.id}`}
                  >
                    Xem từ vựng
                  </Link>
                )}
              />
              <div className="flex items-center justify-end gap-4 p-5 text-sm">
                <button
                  className="secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </button>
                <span>
                  {page} / {Math.max(1, sets.data.pagination.totalPage)}
                </span>
                <button
                  className="secondary"
                  disabled={page >= sets.data.pagination.totalPage}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </button>
              </div>
            </>
          )
        )}
      </section>
    </>
  )
}
