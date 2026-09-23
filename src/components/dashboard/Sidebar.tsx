import { Link, NavLink } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'
export interface NavigationItem {
  to: string
  label: string
  icon: IconName
  section: string
}
export function Sidebar({
  items,
  home,
  label,
  onNavigate,
}: {
  items: NavigationItem[]
  home: string
  label: string
  onNavigate: () => void
}) {
  return (
    <>
      <Link
        to={home}
        onClick={onNavigate}
        className="flex items-center gap-3 px-7 py-8 text-xl font-extrabold tracking-tight"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
          <Icon name="book" />
        </span>
        <span>
          <span className="text-brand">Voca</span>Learn
          <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.2em] text-slate-400">
            {label}
          </span>
        </span>
      </Link>
      <nav aria-label="Điều hướng chính" className="space-y-1 px-4">
        {items.map((item, index) => (
          <div key={item.to}>
            {(index === 0 || items[index - 1].section !== item.section) && (
              <p className="px-4 pb-3 pt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                {item.section}
              </p>
            )}
            <NavLink
              to={item.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-brand text-white shadow-md shadow-blue-200/50' : 'text-slate-500 hover:bg-blue-50 hover:text-brand'}`
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          </div>
        ))}
      </nav>
    </>
  )
}
