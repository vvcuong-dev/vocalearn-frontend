import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { AdminAuthForm } from '../auth/AdminAuthForm'
import type { AuthMode } from '../auth/auth-config'
export function AdminAuthPage({ mode }: { mode: AuthMode }) {
  const { admin } = useAuth()
  if (admin && mode === 'login') return <Navigate to="/admin" replace />
  return (
    <div className="flex w-full justify-center">
      <AdminAuthForm key={mode} mode={mode} />
    </div>
  )
}
