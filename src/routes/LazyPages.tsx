import { lazy } from "react";

export const AdminEditorPage = lazy(() =>
  import("../features/admin/pages/AdminEditorPage").then((module) => ({
    default: module.AdminEditorPage,
  })),
);

export const AdminPermissionsPage = lazy(() =>
  import("../features/admin/pages/AdminPermissionsPage").then((module) => ({
    default: module.AdminPermissionsPage,
  })),
);

export const AdminFolderPage = lazy(() =>
  import("../features/admin/pages/AdminFolderPage").then((module) => ({
    default: module.AdminFolderPage,
  })),
);

export const AdminAuthPage = lazy(() =>
  import("../features/admin/pages/AdminAuthPage").then((module) => ({
    default: module.AdminAuthPage,
  })),
);

export const AdminDashboardPage = lazy(() =>
  import("../features/admin/pages/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);

export const AdminProfilePage = lazy(() =>
  import("../features/admin/pages/AdminProfilePage").then((module) => ({
    default: module.AdminProfilePage,
  })),
);

export const AdminResourcePage = lazy(() =>
  import("../features/admin/pages/AdminResourcePage").then((module) => ({
    default: module.AdminResourcePage,
  })),
);

export const UserAuthPage = lazy(() =>
  import("../features/user/pages/UserAuthPage").then((module) => ({
    default: module.UserAuthPage,
  })),
);

export const UserDashboardPage = lazy(() =>
  import("../features/user/pages/UserDashboardPage").then((module) => ({
    default: module.UserDashboardPage,
  })),
);

export const ExplorePage = lazy(() =>
  import("../features/user/pages/ExplorePage").then((module) => ({
    default: module.ExplorePage,
  })),
);

export const LearningPathPage = lazy(() =>
  import("../features/user/pages/ExplorePage").then((module) => ({
    default: module.LearningPathPage,
  })),
);

export const LibraryPage = lazy(() =>
  import("../features/user/pages/LibraryPage").then((module) => ({
    default: module.LibraryPage,
  })),
);

export const FolderPage = lazy(() =>
  import("../features/user/pages/FolderPage").then((module) => ({
    default: module.FolderPage,
  })),
);

export const WordSetPage = lazy(() =>
  import("../features/user/pages/WordSetPage").then((module) => ({
    default: module.WordSetPage,
  })),
);

export const UserEditorPage = lazy(() =>
  import("../features/user/pages/UserEditorPage").then((module) => ({
    default: module.UserEditorPage,
  })),
);

export const UserProfilePage = lazy(() =>
  import("../features/user/pages/UserProfilePage").then((module) => ({
    default: module.UserProfilePage,
  })),
);

export const LandingPage = lazy(() =>
  import("../features/user/pages/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
