import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { logout } from '../api/auth'
import { useQuery } from '@tanstack/react-query'
import { getCart } from '../api/cart'
import { useLang } from '../store/lang'

export default function Navbar() {
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang, setLang } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const cartCount = cart?.data?.items_count ?? 0
  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/')
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(10,20,40,0.25)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-[60px] sm:h-[64px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0" onClick={closeMenu}>
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-white text-sm transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #ff4d1c 0%, #ff7a50 100%)', boxShadow: '0 4px 12px rgba(255,77,28,0.4)' }}
            >
              S
            </div>
            <span className="text-white font-extrabold text-[16px] sm:text-[17px] tracking-tight">StepUp</span>
          </Link>

          {/* Center links — desktop only */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/"
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                color: isActive('/') ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
              onMouseEnter={e => { if (!isActive('/')) e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { if (!isActive('/')) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              {t('shop')}
            </Link>
            {isAuthenticated && (
              <Link to="/orders"
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  color: isActive('/orders') ? '#fff' : 'rgba(255,255,255,0.5)',
                  background: isActive('/orders') ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive('/orders')) e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { if (!isActive('/orders')) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                {t('orders')}
              </Link>
            )}
            {user?.is_admin && (
              <Link to="/admin/products"
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{ color: '#ff7a50' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#ff7a50')}
              >
                {t('admin')}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 sm:gap-1 mr-0.5 sm:mr-1">
              <button onClick={() => setLang('uz')} className={`lang-btn${lang === 'uz' ? ' active' : ''}`}>UZ</button>
              <button onClick={() => setLang('ru')} className={`lang-btn${lang === 'ru' ? ' active' : ''}`}>RU</button>
            </div>

            {isAuthenticated ? (
              <>
                {/* Cart — always visible */}
                <Link
                  to="/cart"
                  aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : 'Cart'}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                >
                  <svg className="w-[19px] h-[19px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                      style={{ background: '#ff4d1c', boxShadow: '0 2px 6px rgba(255,77,28,0.5)' }}
                      aria-hidden="true"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                {/* Profile — desktop only */}
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all"
                  style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold uppercase"
                    style={{ background: 'rgba(255,77,28,0.25)', color: '#ff7a50' }}
                  >
                    {user?.name?.[0]}
                  </span>
                  {user?.name}
                </Link>

                {/* Logout — desktop only */}
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'transparent' }}
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="hidden md:flex text-sm font-medium px-3 py-2.5 rounded-full transition-all items-center"
                  style={{ color: 'rgba(255,255,255,0.55)', minHeight: 40 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                >
                  {t('login')}
                </Link>
                <Link to="/register"
                  className="hidden md:flex text-sm font-bold px-4 py-2.5 rounded-full text-white transition-all items-center"
                  style={{ background: 'linear-gradient(135deg, #ff4d1c, #ff6a3c)', boxShadow: '0 4px 12px rgba(255,77,28,0.35)', minHeight: 40 }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,77,28,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,77,28,0.35)')}
                >
                  {t('signup')}
                </Link>
              </>
            )}

            {/* Hamburger — mobile only (md and below) */}
            <button
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all ml-0.5"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={closeMenu}
          aria-hidden="true"
        >
          <div
            className="absolute top-[60px] sm:top-[64px] left-0 right-0 fade-up"
            style={{
              background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 16px 40px rgba(10,20,40,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-4 space-y-1">
              <Link
                to="/"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  color: isActive('/') ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">{t('shop')}</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/orders"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                    style={{
                      color: isActive('/orders') ? '#fff' : 'rgba(255,255,255,0.55)',
                      background: isActive('/orders') ? 'rgba(255,255,255,0.1)' : 'transparent',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm font-medium">{t('orders')}</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                    style={{
                      color: isActive('/profile') ? '#fff' : 'rgba(255,255,255,0.55)',
                      background: isActive('/profile') ? 'rgba(255,255,255,0.1)' : 'transparent',
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0"
                      style={{ background: 'rgba(255,77,28,0.25)', color: '#ff7a50' }}
                    >
                      {user?.name?.[0]}
                    </span>
                    <span className="text-sm font-medium truncate">{user?.name}</span>
                  </Link>
                </>
              )}

              {user?.is_admin && (
                <Link
                  to="/admin/products"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                  style={{ color: '#ff7a50' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('admin')}</span>
                </Link>
              )}

              {/* Divider */}
              <div className="h-px mx-4 my-2" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">{t('logout')}</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2 px-2 pb-2 pt-1">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="w-full text-center py-3 rounded-2xl text-sm font-semibold transition-all"
                    style={{ border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="w-full text-center py-3 rounded-2xl text-sm font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #ff4d1c, #ff6a3c)', boxShadow: '0 4px 12px rgba(255,77,28,0.35)' }}
                  >
                    {t('signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
