import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { DashboardLayout } from '../../../layouts/DashboardLayout'
import { QueryState } from '../../../components/ui/QueryState'
import { useAuth } from '../auth/context'
import { adminNavigation } from '../navigation'
export function AdminLayout() {
  const { admin, logout } = useAuth()
  const { pathname } = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!admin) return <Navigate to="/admin/login" replace />
  async function signOut() {
    setBusy(true)
    setError('')
    try {
      await logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng xuất.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <DashboardLayout
      items={adminNavigation}
      home="/admin"
      label="ADMIN WORKSPACE"
      name={admin.name}
      title={
        adminNavigation.find((item) => item.to === pathname)?.label ||
        'Quản trị'
      }
      profilePath="/admin/profile"
      onLogout={signOut}
      loggingOut={busy}
    >
      {error && (
        <div className="mb-5">
          <QueryState error={error} retry={signOut} />
        </div>
      )}
      <Outlet />
    </DashboardLayout>
  )
}
