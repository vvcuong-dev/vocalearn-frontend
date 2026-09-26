import {
  AdminEditorPage,
  AdminPermissionsPage,
  AdminFolderPage,
  AdminAuthPage,
  AdminDashboardPage,
  AdminProfilePage,
  AdminResourcePage,
} from "./LazyPages";
import { Fragment } from "react";
import { Outlet, Route } from "react-router-dom";
import { AuthProvider } from "../features/admin/auth/AuthProvider";
import { AdminAuthLayout } from "../features/admin/components/AdminAuthLayout";
import { AdminLayout } from "../features/admin/components/AdminLayout";
import { resourceKeys } from "../features/admin/api/resources";

export const adminRoutes = (
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
      <Route path="roles/:id/permissions" element={<AdminPermissionsPage />} />
      {resourceKeys.map((resource) => (
        <Fragment key={resource}>
          {resource !== "folders" && (
            <Route
              path={`${resource}/new`}
              element={
                <AdminEditorPage key={`${resource}-new`} resource={resource} />
              }
            />
          )}
          <Route
            path={`${resource}/:id`}
            element={
              resource === "folders" ? (
                <AdminFolderPage />
              ) : (
                <AdminEditorPage key={resource} resource={resource} />
              )
            }
          />
          <Route
            key={resource}
            path={resource}
            element={<AdminResourcePage key={resource} resource={resource} />}
          />
        </Fragment>
      ))}
    </Route>
  </Route>
);
