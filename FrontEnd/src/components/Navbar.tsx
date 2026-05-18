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
  }

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(10,20,40,0.25)',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[64px]">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #ff4d1c 0%, #ff7a50 100%)', boxShadow: '0 4px 12px rgba(255,77,28,0.4)' }}
          >
            S
          </div>
          <span className="text-white font-extrabold text-[17px] tracking-tight">StepUp</span>
        </Link>

        {/* Center links */}
        <div className="hidden sm:flex items-center gap-1">
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

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="flex items-center gap-1 mr-1">
            <button onClick={() => setLang('uz')} className={`lang-btn${lang === 'uz' ? ' active' : ''}`}>UZ</button>
            <button onClick={() => setLang('ru')} className={`lang-btn${lang === 'ru' ? ' active' : ''}`}>RU</button>
          </div>

          {isAuthenticated ? (
            <>
              {/* Cart */}
              <Link
                to="/cart"
                aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : 'Cart'}
                className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all"
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

              {/* Profile */}
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all"
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

              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
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
                className="text-sm font-medium px-3 py-1.5 rounded-full transition-all"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              >
                {t('login')}
              </Link>
              <Link to="/register"
                className="text-sm font-bold px-4 py-1.5 rounded-full text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #ff4d1c, #ff6a3c)', boxShadow: '0 4px 12px rgba(255,77,28,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,77,28,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,77,28,0.35)')}
              >
                {t('signup')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
