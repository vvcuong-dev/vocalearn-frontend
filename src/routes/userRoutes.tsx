import {
  UserAuthPage,
  UserDashboardPage,
  ExplorePage,
  LearningPathPage,
  LibraryPage,
  FolderPage,
  WordSetPage,
  UserEditorPage,
  UserProfilePage,
} from "./LazyPages";
import { UserAuthProvider } from "../features/user/auth/UserAuthProvider";
import { UserLayout } from "../features/user/components/UserLayout";
import { Fragment } from "react";
import { Outlet, Route } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";

export const userRoutes = (
  <Route
    element={
      <UserAuthProvider>
        <Outlet />
      </UserAuthProvider>
    }
  >
    {publicRoutes}
    <Route path="learn" element={<UserLayout />}>
      <Route index element={<UserDashboardPage />} />
      <Route path="explore" element={<ExplorePage />} />
      <Route path="paths/:id" element={<LearningPathPage />} />
      <Route path="library" element={<LibraryPage />} />
      <Route path="folders/:id" element={<FolderPage />} />
      <Route path="word-sets/:id" element={<WordSetPage />} />
      {(["folders", "word-sets", "words"] as const).map((resource) => (
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
        element={<UserAuthPage key="user-password" mode="change-password" />}
      />
      <Route
        path="change-email"
        element={<UserAuthPage key="user-email" mode="change-email" />}
      />
    </Route>
  </Route>
);
