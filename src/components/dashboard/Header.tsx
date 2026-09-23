import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
export function Header({
  name,
  title,
  profilePath,
  onMenu,
}: {
  name: string
  title: string
  profilePath: string
  onMenu: () => void
}) {
  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-slate-200/70 bg-white px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Mở menu"
          aria-controls="dashboard-sidebar"
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
        >
          <Icon name="menu" />
        </button>
        <p className="text-sm text-slate-500">
          Không gian làm việc <span className="mx-2 text-slate-300">/</span>
          <span className="font-semibold text-slate-700">{title}</span>
        </p>
      </div>
      <Link
        to={profilePath}
        className="flex shrink-0 items-center gap-3 rounded-lg p-1 focus-visible:outline-brand"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 font-bold text-brand">
          {name.trim().charAt(0).toUpperCase() || 'A'}
        </span>
        <span className="hidden max-w-44 truncate text-sm font-semibold sm:block">
          {name}
        </span>
      </Link>
    </header>
  )
}
