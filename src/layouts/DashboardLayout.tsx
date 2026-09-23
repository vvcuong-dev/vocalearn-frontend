import { useEffect, useState, type ReactNode } from 'react'
import { Header } from '../components/dashboard/Header'
import { Sidebar, type NavigationItem } from '../components/dashboard/Sidebar'
import { Icon } from '../components/ui/Icon'
export function DashboardLayout({
  children,
  items,
  home,
  label,
  name,
  title,
  profilePath,
  onLogout,
  loggingOut,
}: {
  children: ReactNode
  items: NavigationItem[]
  home: string
  label: string
  name: string
  title: string
  profilePath: string
  onLogout: () => void
  loggingOut: boolean
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  return (
    <div className="min-h-svh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4"
      >
        Đến nội dung chính
      </a>
      {open && (
        <button
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
        />
      )}
      <aside
        id="dashboard-sidebar"
        className={`${open ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-slate-200/70 bg-white lg:flex`}
      >
        <button
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="absolute right-2 top-2 rounded-lg p-2 lg:hidden"
        >
          <Icon name="close" />
        </button>
        <div className="flex-1 overflow-y-auto pb-6">
          <Sidebar
            items={items}
            home={home}
            label={label}
            onNavigate={() => setOpen(false)}
          />
        </div>
        <div className="border-t border-slate-100 p-5">
          <button
            disabled={loggingOut}
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Icon name="logout" />
            {loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <Header
          name={name}
          title={title}
          profilePath={profilePath}
          onMenu={() => setOpen(true)}
        />
        <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {children}
        </main>
        <footer className="px-8 pb-6 text-xs text-slate-400">
          VocaLearn · Học mỗi ngày, tiến xa hơn.
        </footer>
      </div>
    </div>
  )
}
