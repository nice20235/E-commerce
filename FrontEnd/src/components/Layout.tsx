import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import { useLang } from '../store/lang'
import { useAuthStore } from '../store/auth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { lang } = useLang()
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7f5f2' }}>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {children}
      </main>

      <footer style={{ background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)' }} className="mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-6 sm:pb-8">

          {/* Top grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 pb-8 sm:pb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{ background: 'linear-gradient(135deg, #ff4d1c, #ff7a50)', boxShadow: '0 4px 12px rgba(255,77,28,0.35)' }}
                >
                  S
                </div>
                <span className="text-white font-extrabold text-base">StepUp</span>
              </div>
              <p className="text-xs leading-relaxed max-w-[260px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {lang === 'uz'
                  ? 'Qulay va chiroyli poyabzal — har bir qadam uchun.'
                  : 'Удобная и стильная обувь — для каждого шага.'}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4 sm:mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {lang === 'uz' ? 'Menyu' : 'Навигация'}
              </h4>
              <nav className="flex flex-col gap-3">
                <Link to="/" className="footer-link">{lang === 'uz' ? 'Do\'kon' : 'Магазин'}</Link>
                {isAuthenticated && (
                  <Link to="/orders" className="footer-link">{lang === 'uz' ? 'Buyurtmalarim' : 'Мои заказы'}</Link>
                )}
                <Link to="/public-offer" className="footer-link">
                  {lang === 'uz' ? 'Ommaviy oferta' : 'Публичная оферта'}
                </Link>
              </nav>
            </div>

            {/* Info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4 sm:mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {lang === 'uz' ? 'Ma\'lumot' : 'Информация'}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {lang === 'uz'
                  ? 'Har kuni qulay va chiroyli oyoq kiyim kiyib yuring. Sifat va qulaylik — bizning ustuvorligimiz.'
                  : 'Носите удобную и красивую обувь каждый день. Качество и комфорт — наш приоритет.'}
              </p>
            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-center sm:text-left" style={{ color: 'rgba(255,255,255,0.22)' }}>
              &copy; {new Date().getFullYear()} StepUp. {lang === 'uz' ? 'Barcha huquqlar himoyalangan.' : 'Все права защищены.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
