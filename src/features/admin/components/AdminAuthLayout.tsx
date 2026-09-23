import { Outlet } from "react-router-dom";
export function AdminAuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-brand bg-[url('/bg-account.svg')] bg-cover bg-center px-4 py-12">
      <Outlet />
    </main>
  );
}
