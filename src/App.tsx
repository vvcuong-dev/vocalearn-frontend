import { Suspense } from "react";
import { Loading } from "./components/ui/Loading";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";

export default function App() {
  return (
    <Suspense fallback={<Loading fullPage />}><RouterProvider router={router} /></Suspense>
  );
}
