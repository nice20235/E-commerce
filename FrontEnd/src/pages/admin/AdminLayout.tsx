import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useLang } from '../../store/lang'

const links = [
  {
    to: '/admin/products',
    labelKey: 'adminProducts' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    to: '/admin/orders',
    labelKey: 'adminOrders' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    to: '/admin/users',
    labelKey: 'adminUsers' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

export default function AdminLayout() {
  const { t } = useLang()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (to: string) => location.pathname.startsWith(to)

  return (
    <div className="relative">
      {/* ── Desktop layout: sidebar + content ── */}
      <div className="hidden md:flex gap-6 min-h-[70vh]">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0">
          <div
            className="rounded-2xl p-3 sticky top-24"
            style={{ background: 'linear-gradient(180deg, #1a2f4e 0%, #0f1e33 100%)', boxShadow: '0 8px 32px rgba(26,47,78,0.25)' }}
          >
            {/* Admin label */}
            <div className="flex items-center gap-2 px-2 mb-4 pt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff4d1c' }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {t('admin')}
              </p>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={({ isActive: active }) => ({
                    background: active ? 'linear-gradient(135deg, #ff4d1c, #ff6a3c)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                    boxShadow: active ? '0 4px 12px rgba(255,77,28,0.35)' : 'none',
                  })}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    if (!el.getAttribute('aria-current')) {
                      el.style.color = '#fff'
                      el.style.background = 'rgba(255,255,255,0.08)'
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    if (!el.getAttribute('aria-current')) {
                      el.style.color = 'rgba(255,255,255,0.45)'
                      el.style.background = 'transparent'
                    }
                  }}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{link.icon}</span>
                  <span className="truncate">{t(link.labelKey)}</span>
                </NavLink>
              ))}
            </nav>

          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>

      {/* ── Mobile layout: top bar + bottom tab nav ── */}
      <div className="md:hidden">
        {/* Mobile top bar with admin label + hamburger */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)', boxShadow: '0 4px 16px rgba(26,47,78,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff4d1c' }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('admin')}
            </p>
          </div>

          {/* Current page label */}
          <span className="text-sm font-semibold text-white">
            {links.find(l => isActive(l.to)) ? t(links.find(l => isActive(l.to))!.labelKey) : t('admin')}
          </span>

          {/* Hamburger / close */}
          <button
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center justify-center rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.6)', width: 36, height: 36, background: 'rgba(255,255,255,0.07)' }}
          >
            {sidebarOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile slide-down menu */}
        {sidebarOpen && (
          <div
            className="rounded-2xl p-3 mb-4 fade-up"
            style={{ background: 'linear-gradient(180deg, #1a2f4e 0%, #0f1e33 100%)', boxShadow: '0 8px 32px rgba(26,47,78,0.25)' }}
          >
            <nav className="space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={({ isActive: active }) => ({
                    background: active ? 'linear-gradient(135deg, #ff4d1c, #ff6a3c)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    boxShadow: active ? '0 4px 12px rgba(255,77,28,0.35)' : 'none',
                  })}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{link.icon}</span>
                  <span>{t(link.labelKey)}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Main content */}
        <div className="min-w-0 pb-20">
          <Outlet />
        </div>

        {/* Bottom tab bar — always visible on mobile */}
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 safe-area-bottom"
          style={{
            background: 'linear-gradient(180deg, #1a2f4e 0%, #0f1e33 100%)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 -8px 32px rgba(10,20,40,0.4)',
          }}
        >
          {links.map((link) => {
            const active = isActive(link.to)
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all flex-1"
                style={{
                  color: active ? '#ff7a50' : 'rgba(255,255,255,0.35)',
                  background: active ? 'rgba(255,77,28,0.12)' : 'transparent',
                }}
              >
                <span aria-hidden="true">{link.icon}</span>
                <span className="text-[10px] font-semibold">{t(link.labelKey)}</span>
              </NavLink>
            )
          })}
          <NavLink
            to="/"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all flex-1"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-semibold">Shop</span>
          </NavLink>
        </div>
      </div>
    </div>
  )
}
