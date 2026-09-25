import { UserAuthProvider } from '../features/user/auth/UserAuthProvider'
import { PublicLayout } from '../features/user/components/PublicLayout'
import { UserLayout } from '../features/user/components/UserLayout'
import { LandingPage } from '../features/user/pages/LandingPage'
import { UserAuthPage } from '../features/user/pages/UserAuthPage'
import { UserDashboardPage } from '../features/user/pages/UserDashboardPage'
import {
  ExplorePage,
  LearningPathPage,
} from '../features/user/pages/ExplorePage'
import { LibraryPage } from '../features/user/pages/LibraryPage'
import { FolderPage } from '../features/user/pages/FolderPage'
import { WordSetPage } from '../features/user/pages/WordSetPage'
import { UserEditorPage } from '../features/user/pages/UserEditorPage'
import { UserProfilePage } from '../features/user/pages/UserProfilePage'
import { Fragment } from 'react'
import { AdminEditorPage } from '../features/admin/pages/AdminEditorPage'
import { AdminPermissionsPage } from '../features/admin/pages/AdminPermissionsPage'
import { AdminFolderPage } from '../features/admin/pages/AdminFolderPage'
import { Link, Outlet, Route, Routes } from 'react-router-dom'
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
      <Route
        element={
          <UserAuthProvider>
            <Outlet />
          </UserAuthProvider>
        }
      >
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          {(
            ['login', 'register', 'forgot-password', 'reset-password'] as const
          ).map((mode) => (
            <Route
              key={mode}
              path={mode}
              element={<UserAuthPage key={mode} mode={mode} />}
            />
          ))}
        </Route>
        <Route path="learn" element={<UserLayout />}>
          <Route index element={<UserDashboardPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="paths/:id" element={<LearningPathPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="folders/:id" element={<FolderPage />} />
          <Route path="word-sets/:id" element={<WordSetPage />} />
          {(['folders', 'word-sets', 'words'] as const).map((resource) => (
            <Fragment key={resource}>
              <Route
                path={`${resource}/new`}
                element={
                  <UserEditorPage key={`${resource}-new`} resource={resource} />
                }
              />
              <Route
                path={`${resource}/:id/edit`}
                element={<UserEditorPage key={resource} resource={resource} />}
              />
            </Fragment>
          ))}
          <Route path="profile" element={<UserProfilePage />} />
          <Route
            path="change-password"
            element={
              <UserAuthPage key="user-password" mode="change-password" />
            }
          />
          <Route
            path="change-email"
            element={<UserAuthPage key="user-email" mode="change-email" />}
          />
        </Route>
      </Route>
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
          <Route path="permissions" element={<AdminPermissionsPage />} />
          <Route
            path="roles/:id/permissions"
            element={<AdminPermissionsPage />}
          />
          {resourceKeys.map((resource) => (
            <Fragment key={resource}>
              {resource !== 'folders' && (
                <Route
                  path={`${resource}/new`}
                  element={
                    <AdminEditorPage
                      key={`${resource}-new`}
                      resource={resource}
                    />
                  }
                />
              )}
              <Route
                path={`${resource}/:id`}
                element={
                  resource === 'folders' ? (
                    <AdminFolderPage />
                  ) : (
                    <AdminEditorPage key={resource} resource={resource} />
                  )
                }
              />
              <Route
                key={resource}
                path={resource}
                element={
                  <AdminResourcePage key={resource} resource={resource} />
                }
              />
            </Fragment>
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
