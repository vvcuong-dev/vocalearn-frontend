import { useAuth } from '../auth/context'
export function AdminProfilePage() {
  const { admin } = useAuth()
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-10">
      <p className="mb-2 text-sm font-semibold text-brand">
        KHÔNG GIAN QUẢN TRỊ
      </p>
      <h1 className="text-3xl font-bold">Xin chào, {admin?.name}</h1>
      <p className="mt-3 text-slate-500">
        Quản lý thông tin đăng nhập và bảo mật tài khoản VocaLearn.
      </p>
      <dl className="mt-8 grid gap-6 border-t border-slate-100 pt-7 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-500">Email đăng nhập</dt>
          <dd className="mt-2 break-all font-semibold">{admin?.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Trạng thái tài khoản</dt>
          <dd className="mt-2 font-semibold text-emerald-700">
            {admin?.status === 'ACTIVE' ? 'Đang hoạt động' : admin?.status}
          </dd>
        </div>
      </dl>
    </section>
  )
}
