import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { api } from '../../../lib/api'
import { PageHeading } from '../../../components/ui/PageHeading'
import { QueryState } from '../../../components/ui/QueryState'
export function AdminProfilePage() {
  const { admin, reload } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function save(event: FormEvent<HTMLFormElement>, avatar: boolean) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const values = new FormData(form)
    setError('')
    setSuccess('')
    if (avatar) {
      const file = values.get('avatar')
      if (
        !(file instanceof File) ||
        !file.size ||
        file.size > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      ) {
        setError('Chọn ảnh JPEG, PNG hoặc WebP tối đa 5 MB.')
        return
      }
    }
    setBusy(true)
    try {
      const name = String(values.get('name') || '').trim()
      const phone = String(values.get('phone') || '').trim()
      if (!avatar && (name.length < 5 || name.length > 50))
        throw new Error('Tên cần từ 5 đến 50 ký tự.')
      await api(
        `/admin/profile${avatar ? '/avatar' : ''}`,
        avatar ? 'POST' : 'PATCH',
        avatar ? values : { name, ...(phone ? { phone } : {}) },
        true,
      )
      setSuccess('Đã lưu thông tin.')
      await reload()
      if (avatar) form.reset()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể cập nhật tài khoản.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeading
        title="Tài khoản của bạn"
        description="Cập nhật thông tin cá nhân và ảnh đại diện."
      />
      {error && (
        <div className="mb-5">
          <QueryState error={error} />
        </div>
      )}
      {success && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-emerald-50 p-4 text-emerald-700"
        >
          {success}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          {admin?.avatar ? (
            <img
              src={admin.avatar}
              alt="Ảnh đại diện của bạn"
              className="mx-auto h-28 w-28 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-blue-50 text-4xl font-bold text-brand">
              {admin?.name.charAt(0)}
            </div>
          )}
          <p className="mt-4 text-center font-bold">{admin?.name}</p>
          <p className="mt-1 break-all text-center text-sm text-slate-500">
            {admin?.email}
          </p>
          <form
            onSubmit={(event) => save(event, true)}
            className="mt-6 space-y-4"
          >
            <label htmlFor="avatar" className="block text-sm font-semibold">
              Đổi avatar
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={busy}
              className="w-full text-xs"
            />
            <p className="text-xs text-slate-500">
              JPEG, PNG hoặc WebP · Tối đa 5 MB
            </p>
            <button className="secondary w-full" disabled={busy}>
              Tải ảnh lên
            </button>
          </form>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 font-bold">Thông tin cá nhân</h2>
          <form
            key={`${admin?.name}:${admin?.phone}`}
            onSubmit={(event) => save(event, false)}
          >
            <fieldset disabled={busy} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Họ tên
                </label>
                <input
                  id="name"
                  name="name"
                  className="field"
                  defaultValue={admin?.name}
                  required
                  minLength={5}
                  maxLength={50}
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Số điện thoại Việt Nam
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="field"
                  defaultValue={admin?.phone || ''}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Để trống để giữ nguyên số điện thoại hiện tại.
                </p>
              </div>
              <button className="primary" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </fieldset>
          </form>
          <div className="mt-6 flex gap-5 border-t border-slate-100 pt-5 text-sm">
            <Link className="text-link" to="/admin/change-email">
              Đổi email
            </Link>
            <Link className="text-link" to="/admin/change-password">
              Đổi mật khẩu
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
