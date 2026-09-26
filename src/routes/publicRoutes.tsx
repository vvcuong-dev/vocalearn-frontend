import {
  LandingPage,
  UserAuthPage,
} from "./LazyPages";
import { PublicLayout } from "../features/user/components/PublicLayout";
import { Route } from "react-router-dom";

export const publicRoutes = (
  <Route element={<PublicLayout />}>
    <Route index element={<LandingPage />} />
    {(["login", "register", "forgot-password", "reset-password"] as const).map(
      (mode) => (
        <Route
          key={mode}
          path={mode}
          element={<UserAuthPage key={mode} mode={mode} />}
        />
      ),
    )}
  </Route>
);
