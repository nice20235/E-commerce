import { Link } from 'react-router-dom'
import { useLang } from '../store/lang'

export default function ForgotPassword() {
  const { t } = useLang()

  return (
    <div className="min-h-[calc(100vh-60px)] sm:min-h-[82vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-[400px]">

        {/* Brand header */}
        <div className="text-center mb-7 sm:mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3 group">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1a2f4e, #243c61)', boxShadow: '0 8px 24px rgba(26,47,78,0.3)' }}
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#ff4d1c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black mt-4" style={{ color: '#1a2f4e' }}>{t('resetPassword')}</h1>
        </div>

        {/* Info card */}
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fff7ed' }}>
            <svg className="w-7 h-7" style={{ color: '#c2410c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <p className="font-bold text-base mb-2" style={{ color: '#1a2f4e' }}>
            {t('resetPassword')}
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#888' }}>
            {t('resetSub')}
          </p>

          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-6 text-left"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c2410c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
              {t('resetContactSupport')}
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: '#1a2f4e', minHeight: 44 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#1a2f4e')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
