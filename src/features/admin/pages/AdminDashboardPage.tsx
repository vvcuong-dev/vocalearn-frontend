import { Link } from 'react-router-dom'
import { PageHeading } from '../../../components/ui/PageHeading'
import { Icon } from '../../../components/ui/Icon'
import { QueryState } from '../../../components/ui/QueryState'
import { useApiQuery } from '../../../hooks/useApiQuery'
import { useAuth } from '../auth/context'
import { resourceKeys, type Page, type ResourceItem } from '../api/resources'
import { StatCard } from '../components/StatCard'
import { ResourceTable } from '../components/ResourceTable'
export function AdminDashboardPage() {
  const { admin } = useAuth()
  const { data, error, loading, retry } = useApiQuery<Page<ResourceItem>>(
    '/admin/word-sets?page=1&limit=5',
  )
  return (
    <>
      <PageHeading
        title="Tổng quan"
        description={`Chào ${admin?.name || 'bạn'}, cùng theo dõi không gian học tập VocaLearn.`}
        action={
          <span className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500">
            {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(
              new Date(),
            )}
          </span>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {resourceKeys.filter(key => ['users', 'categories', 'learning-paths', 'word-sets'].includes(key)).map((resource) => (
          <StatCard key={resource} resource={resource} />
        ))}
      </div>
      <div className="my-7 flex flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-brand px-7 py-8 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
            Học mỗi ngày · Tiến xa hơn
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            Xây dựng hành trình học tập tốt hơn
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100">
            Theo dõi nội dung, kết nối kiến thức và đồng hành cùng người học.
          </p>
        </div>
        <Link
          to="/admin/learning-paths"
          className="flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 sm:self-auto"
        >
          Khám phá lộ trình <Icon name="arrow" />
        </Link>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
          <div className="flex items-center justify-between gap-3 p-6">
            <div>
              <h2 className="font-bold">Kho bộ từ vựng</h2>
              <p className="mt-1 text-xs text-slate-400">
                Một góc nội dung hiện có trong hệ thống
              </p>
            </div>
            <Link to="/admin/word-sets" className="text-link shrink-0 text-xs">
              Xem tất cả
            </Link>
          </div>
          {loading || error ? (
            <div className="p-5 pt-0">
              <QueryState loading={loading} error={error} retry={retry} />
            </div>
          ) : (
            data && <ResourceTable resource="word-sets" items={data.items} />
          )}
        </section>
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6">
          <h2 className="font-bold">Tài khoản của bạn</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Thông tin và bảo mật dành cho quản trị viên.
          </p>
          <div className="my-6 rounded-xl bg-slate-50 p-4">
            <p className="font-semibold">{admin?.name}</p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {admin?.email}
            </p>
          </div>
          <Link
            to="/admin/profile"
            className="flex items-center justify-between border-b border-slate-100 py-3 text-sm text-slate-600"
          >
            Thông tin tài khoản <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <Link
            to="/admin/change-password"
            className="flex items-center justify-between py-3 text-sm text-slate-600"
          >
            Đổi mật khẩu <Icon name="shield" className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </>
  )
}
