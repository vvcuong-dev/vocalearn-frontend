import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './context'
import { api } from '../../../lib/api'
import { FormField } from '../../../components/ui/FormField'
import { titles, descriptions, type AuthMode } from './auth-config'
export function AdminAuthForm({ mode }: { mode: AuthMode }) {
  const { login, reload } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const newPassword = mode === 'reset-password' || mode === 'change-password'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >
    setError('')
    setSuccess('')
    if (newPassword && values.newPassword !== values.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (
      newPassword &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).{8,72}$/.test(
        values.newPassword,
      )
    ) {
      setError(
        'Mật khẩu cần 8–72 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.',
      )
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(values.email.trim(), values.password)
        navigate('/admin', { replace: true })
      }
      if (mode === 'forgot-password') {
        await api('/admin/auth/forgot-password', 'POST', {
          email: values.email.trim(),
        })
        setSuccess(
          'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra cả thư rác.',
        )
      }
      if (mode === 'reset-password') {
        await api('/admin/auth/reset-password', 'POST', {
          token,
          newPassword: values.newPassword,
        })
        setSuccess(
          'Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.',
        )
      }
      if (mode === 'change-password') {
        await api(
          '/admin/auth/change-password',
          'PATCH',
          { oldPassword: values.oldPassword, newPassword: values.newPassword },
          true,
        )
        setSuccess('Đã đổi mật khẩu thành công.')
      }
      if (mode === 'change-email') {
        await api(
          '/admin/auth/change-email',
          'PATCH',
          { newEmail: values.newEmail.trim(), password: values.password },
          true,
        )
        setSuccess(
          'Đã đổi email thành công. Hãy dùng email mới cho lần đăng nhập tiếp theo.',
        )
        await reload()
      }
      form.reset()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-blue-950/5 sm:p-12">
      <p className="mb-7 text-center text-sm font-bold tracking-widest text-brand">
        VOCALEARN / ADMIN
      </p>
      <h1 className="text-center text-3xl font-bold tracking-tight">
        {titles[mode]}
      </h1>
      <p className="mb-8 mt-3 text-center leading-relaxed text-slate-500">
        {descriptions[mode]}
      </p>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-800"
        >
          {success}
        </p>
      )}
      {mode === 'reset-password' && !token ? (
        <p role="alert" className="mb-5 text-sm text-red-700">
          Link thiếu mã đặt lại mật khẩu. Vui lòng yêu cầu link mới.
        </p>
      ) : (
        !(mode === 'reset-password' && success) && (
          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={busy} className="space-y-5">
              {(mode === 'login' || mode === 'forgot-password') && (
                <FormField name="email" label="Email" type="email" />
              )}
              {mode === 'change-email' && (
                <FormField name="newEmail" label="Email mới" type="email" />
              )}
              {(mode === 'login' || mode === 'change-email') && (
                <FormField name="password" label="Mật khẩu" type="password" />
              )}
              {mode === 'change-password' && (
                <FormField
                  name="oldPassword"
                  label="Mật khẩu hiện tại"
                  type="password"
                />
              )}
              {newPassword && (
                <>
                  <FormField
                    name="newPassword"
                    label="Mật khẩu mới"
                    type="password"
                    fresh
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    8–72 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>
                  <FormField
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    fresh
                  />
                </>
              )}
              {mode === 'login' && (
                <div className="text-right text-sm">
                  <Link className="text-link" to="/admin/forgot-password">
                    Quên mật khẩu?
                  </Link>
                </div>
              )}
              <button className="primary" disabled={busy} type="submit">
                {busy
                  ? 'Đang xử lý…'
                  : mode === 'forgot-password'
                    ? 'Gửi link đặt lại mật khẩu'
                    : titles[mode]}
              </button>
            </fieldset>
          </form>
        )
      )}
      {mode === 'login' ? (
        <p className="mt-7 text-center text-xs leading-5 text-slate-500">
          Chỉ dành cho tài khoản quản trị viên được cấp quyền.
        </p>
      ) : (
        !mode.startsWith('change') && (
          <div className="mt-6 space-y-3 text-center text-sm">
            <Link className="text-link block" to="/admin/login">
              Về trang đăng nhập
            </Link>
            {mode === 'reset-password' && (
              <Link className="text-link block" to="/admin/forgot-password">
                Yêu cầu link mới
              </Link>
            )}
          </div>
        )
      )}
    </section>
  )
}
