import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Link,
} from "react-router-dom";
import { userRoutes } from "./userRoutes";
import { adminRoutes } from "./adminRoutes";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {userRoutes}
      {adminRoutes}
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
    </>,
  ),
);
