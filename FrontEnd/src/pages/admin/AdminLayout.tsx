import { NavLink, Outlet } from 'react-router-dom'
import { useLang } from '../../store/lang'

export default function AdminLayout() {
  const { t } = useLang()

  const links = [
    { to: '/admin/products', label: t('adminProducts'), icon: '📦' },
    { to: '/admin/orders', label: t('adminOrders'), icon: '🧾' },
    { to: '/admin/users', label: t('adminUsers'), icon: '👥' },
  ]

  return (
    <div className="flex gap-6 min-h-[70vh]">
      <aside className="w-44 flex-shrink-0">
        <div className="rounded-2xl p-3 sticky top-24" style={{ background: '#1a2f4e' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('admin')}</p>
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'nav-admin-active' : 'nav-admin-idle'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? '#ff4d1c' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                })}
              >
                <span className="text-base" aria-hidden="true">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
