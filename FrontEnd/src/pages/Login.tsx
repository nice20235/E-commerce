import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { useLang } from '../store/lang'
import type { AxiosError } from 'axios'

export default function Login() {
  const { setAuth, isAuthenticated, user } = useAuthStore()
  const { t } = useLang()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from
  const [form, setForm] = useState({ name: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => { setAuth(data.user) },
    onError: (err: unknown) => {
      const status = (err as AxiosError)?.response?.status
      setError(status === 401 ? t('invalidCredentials') : t('loginFailed'))
    },
  })

  if (isAuthenticated) {
    const dest = from || (user?.is_admin ? '/admin' : '/')
    return <Navigate to={dest} replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.password) { setError(t('allRequired')); return }
    mutation.mutate(form)
  }

  const inputStyle: React.CSSProperties = {
    background: '#f7f5f2',
    border: '1.5px solid #e8e5e0',
    color: '#1a2f4e',
    fontSize: 16,
    width: '100%',
    outline: 'none',
    borderRadius: 12,
    padding: '13px 16px',
    transition: 'border-color 0.15s, background 0.15s',
  }

  return (
    <div className="min-h-[calc(100vh-60px)] sm:min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-[400px]">

        {/* Brand header */}
        <div className="text-center mb-7 sm:mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3 group">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1a2f4e, #243c61)', boxShadow: '0 8px 24px rgba(26,47,78,0.3)' }}
            >
              <span className="font-black text-xl sm:text-2xl" style={{ color: '#ff4d1c' }}>S</span>
            </div>
            <span className="font-extrabold text-base" style={{ color: '#1a2f4e' }}>StepUp</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black mt-4" style={{ color: '#1a2f4e' }}>{t('welcomeBack')}</h1>
          <p className="text-sm mt-1.5" style={{ color: '#888' }}>{t('signInSub')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            {/* Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(10,10,15,0.4)' }}>
                {t('username')}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="masalan: ali_karimov"
                autoComplete="username"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.background = '#fff' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.background = '#f7f5f2' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(10,10,15,0.4)' }}>
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.background = '#f7f5f2' }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
                  style={{ color: '#bbb', width: 32, height: 32 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1a2f4e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 text-xs font-medium px-4 py-3 rounded-xl" style={{ background: '#fff0ee', color: '#e03c10', border: '1px solid #ffd5cc' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-xl font-bold text-sm text-white transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #1a2f4e, #243c61)',
                boxShadow: '0 4px 16px rgba(26,47,78,0.25)',
                height: 50,
              }}
              onMouseEnter={e => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,77,28,0.4)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1a2f4e, #243c61)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,47,78,0.25)'
              }}
            >
              {mutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                  </svg>
                  {t('signingIn')}
                </>
              ) : t('signIn')}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 text-center space-y-3" style={{ borderTop: '1px solid #e8e5e0' }}>
            <p className="text-sm" style={{ color: '#888' }}>
              {t('noAccount')}{' '}
              <Link to="/register" className="font-bold transition-colors" style={{ color: '#1a2f4e' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#1a2f4e')}
              >
                {t('createOne')}
              </Link>
            </p>
            <Link
              to="/forgot-password"
              className="text-xs block transition-colors"
              style={{ color: '#bbb' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
            >
              {t('forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
