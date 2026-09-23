import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApiQuery } from '../../../hooks/useApiQuery'
import { api } from '../../../lib/api'
import { PageHeading } from '../../../components/ui/PageHeading'
import { QueryState } from '../../../components/ui/QueryState'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
interface Permission {
  id: number
  code: string
  name: string
  group: string | null
}
interface Role {
  id: number
  name: string
  permissions: { permission: Permission }[]
}
export function AdminPermissionsPage() {
  const { id } = useParams()
  const permissions = useApiQuery<Permission[]>('/admin/permissions')
  const role = useApiQuery<Role>(id ? `/admin/roles/${id}` : null)
  return (
    <>
      <PageHeading
        title={
          id ? `Phân quyền · ${role.data?.name || `#${id}`}` : 'Danh sách quyền'
        }
        description={
          id
            ? 'Chọn các quyền mà vai trò được phép sử dụng.'
            : 'Các quyền hiện có trong hệ thống, được nhóm theo chức năng.'
        }
        action={
          <Link className="secondary" to="/admin/roles">
            Danh sách vai trò
          </Link>
        }
      />
      {permissions.loading || permissions.error ? (
        <QueryState {...permissions} />
      ) : id && (role.loading || role.error) ? (
        <QueryState {...role} />
      ) : (
        permissions.data && (
          <PermissionForm
            key={id || 'all'}
            permissions={permissions.data}
            role={role.data}
          />
        )
      )}
    </>
  )
}
function PermissionForm({
  permissions,
  role,
}: {
  permissions: Permission[]
  role?: Role
}) {
  const [selected, setSelected] = useState(
    () => new Set(role?.permissions.map((item) => item.permission.code) || []),
  )
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const groups = Array.from(
    new Set(permissions.map((item) => item.group || 'Khác')),
  )
  async function save() {
    if (!role || busy) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await api(
        `/admin/roles/${role.id}/permissions`,
        'POST',
        { permissionCodes: Array.from(selected) },
        true,
      )
      setConfirm(false)
      setSuccess('Đã cập nhật quyền của vai trò.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật quyền.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-6">
      {success && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-4 text-emerald-700"
        >
          {success}
        </p>
      )}
      {!permissions.length && (
        <p className="text-slate-500">Chưa có quyền trong hệ thống.</p>
      )}
      {groups.map((group) => (
        <fieldset
          key={group}
          disabled={busy}
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <legend className="px-2 font-bold">{group}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {permissions
              .filter((item) => (item.group || 'Khác') === group)
              .map((item) => (
                <label
                  key={item.code}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                >
                  {role && (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-brand"
                      checked={selected.has(item.code)}
                      onChange={(e) => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(item.code)
                        else next.delete(item.code)
                        setSelected(next)
                        setSuccess('')
                      }}
                    />
                  )}
                  <span>
                    <span className="block text-sm font-semibold">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {item.code}
                    </span>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
      ))}
      {role && (
        <button
          className="primary max-w-xs"
          disabled={busy}
          onClick={() => {
            setError('')
            setConfirm(true)
          }}
        >
          Lưu {selected.size} quyền đã chọn
        </button>
      )}
      {confirm && (
        <ConfirmDialog
          title="Cập nhật quyền truy cập?"
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={save}
        >
          <p>
            Thay thế toàn bộ quyền của vai trò “{role?.name}” bằng{' '}
            {selected.size} quyền đã chọn. Thay đổi áp dụng cho các tài khoản
            dùng vai trò này.
          </p>
          {!selected.size && (
            <p className="mt-2 font-semibold">
              Bạn đang bỏ tất cả quyền của vai trò.
            </p>
          )}
          {error && (
            <p className="mt-3 text-red-600" role="alert">
              {error}
            </p>
          )}
        </ConfirmDialog>
      )}
    </section>
  )
}
