import { Link, Outlet } from "react-router-dom";
import { useUserAuth } from "../auth/context";
import { Icon } from "../../../components/ui/Icon";
export function PublicLayout() {
  const { user } = useUserAuth();
  return (
    <div className="min-h-svh bg-[#fbfcf8] text-slate-800">
      <header className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-extrabold"
          >
            <span className="rounded-xl bg-teal-700 p-2 text-white">
              <Icon name="book" />
            </span>
            Voca<span className="-ml-2 text-teal-700">Learn</span>
          </Link>
          <nav
            aria-label="Điều hướng trang giới thiệu"
            className="flex items-center gap-5 text-sm font-semibold"
          >
            <a
              href="/#features"
              className="hidden hover:text-teal-700 sm:block"
            >
              Cách học
            </a>
            <a href="/#start" className="hidden hover:text-teal-700 sm:block">
              Bắt đầu
            </a>
            {user ? (
              <Link
                to="/learn"
                className="rounded-xl bg-teal-700 px-5 py-2.5 text-white"
              >
                Vào học
              </Link>
            ) : (
              <>
                <Link to="/login" className="hover:text-teal-700">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-teal-700 px-4 py-2.5 text-white"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 text-sm text-slate-500">
          <Link to="/" className="font-bold text-teal-700">
            VocaLearn
          </Link>
          <p>Học từng từ. Mở thêm một thế giới.</p>
          <Link to="/admin/login">Dành cho quản trị viên</Link>
        </div>
      </footer>
    </div>
  );
}
