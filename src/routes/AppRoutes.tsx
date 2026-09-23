import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../features/admin/auth/AuthProvider'
import { AdminAuthLayout } from '../features/admin/components/AdminAuthLayout'
import { AdminLayout } from '../features/admin/components/AdminLayout'
import { AdminAuthPage } from '../features/admin/pages/AdminAuthPage'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage'
import { AdminProfilePage } from '../features/admin/pages/AdminProfilePage'
import { AdminResourcePage } from '../features/admin/pages/AdminResourcePage'
import { resourceKeys } from '../features/admin/api/resources'
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route
        path="/admin"
        element={
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        }
      >
        <Route element={<AdminAuthLayout />}>
          <Route path="login" element={<AdminAuthPage mode="login" />} />
          <Route
            path="forgot-password"
            element={<AdminAuthPage mode="forgot-password" />}
          />
          <Route
            path="reset-password"
            element={<AdminAuthPage mode="reset-password" />}
          />
        </Route>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route
            path="change-password"
            element={<AdminAuthPage mode="change-password" />}
          />
          <Route
            path="change-email"
            element={<AdminAuthPage mode="change-email" />}
          />
          {resourceKeys.map((resource) => (
            <Route
              key={resource}
              path={resource}
              element={<AdminResourcePage key={resource} resource={resource} />}
            />
          ))}
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <main className="grid min-h-svh place-content-center gap-4 p-6 text-center">
            <h1 className="text-3xl font-bold">Không tìm thấy trang</h1>
            <Link to="/admin" className="text-link">
              Về trang quản trị
            </Link>
          </main>
        }
      />
    </Routes>
  )
}
