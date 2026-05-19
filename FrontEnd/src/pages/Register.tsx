import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { register } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { useLang } from '../store/lang'
import type { AxiosError } from 'axios'

const baseInputStyle: React.CSSProperties = {
  background: '#f7f5f2',
  border: '1.5px solid #e8e5e0',
  color: '#1a2f4e',
  borderRadius: 12,
  padding: '13px 14px',
  fontSize: 16,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s, background 0.15s',
}

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#1a2f4e'
    e.currentTarget.style.background = '#fff'
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#e8e5e0'
    e.currentTarget.style.background = '#f7f5f2'
  },
}

export default function Register() {
  const { setAuth, isAuthenticated } = useAuthStore()
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', surname: '', phone_number: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => { setAuth(data.user) },
    onError: (err: unknown) => {
      const axErr = err as AxiosError<{ detail?: unknown }>
      const detail = axErr.response?.data?.detail

      // 422 Pydantic error: detail is an array of {msg, loc} objects
      if (Array.isArray(detail)) {
        const msgs = detail.map((d: { msg?: string; loc?: string[] }) =>
          (d.msg ?? '').toLowerCase()
        ).join(' ')
        if (msgs.includes('phone') || msgs.includes('start with +') || msgs.includes('digit')) {
          setError(t('phoneInvalid'))
        } else if (msgs.includes('password')) {
          setError(t('passwordMismatch'))
        } else {
          setError(t('registerFailed'))
        }
        return
      }

      // 400 error: detail is a plain string
      const msg = (typeof detail === 'string' ? detail : '').toLowerCase()
      if (msg.includes('name')) {
        setError(t('userExists'))
      } else if (msg.includes('phone')) {
        setError(t('phoneExists'))
      } else {
        setError(t('registerFailed'))
      }
    },
  })

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { name, surname, phone_number, password, confirm } = form
    if (!name || !surname || !phone_number || !password) { setError(t('allRequired')); return }
    if (!phone_number.startsWith('+')) { setError(t('phoneInvalid')); return }
    if (password !== confirm) { setError(t('passwordMismatch')); return }
    if (password.length < 8) { setError(t('passwordShort')); return }
    mutation.mutate({ name, surname, phone_number, password, confirm_password: confirm })
  }

  const FieldLabel = ({ text }: { text: string }) => (
    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(10,10,15,0.38)' }}>
      {text}
    </label>
  )

  return (
    <div className="min-h-[calc(100vh-60px)] sm:min-h-[82vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm sm:max-w-[420px]">

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
          <h1 className="text-xl sm:text-2xl font-black mt-4" style={{ color: '#1a2f4e' }}>{t('createAccount')}</h1>
          <p className="text-sm mt-1.5" style={{ color: '#888' }}>{t('joinSub')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name + Surname — stack on mobile, grid on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel text={t('username')} />
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="username"
                  autoComplete="given-name"
                  style={baseInputStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <FieldLabel text={t('surname')} />
                <input
                  value={form.surname}
                  onChange={e => setForm({ ...form, surname: e.target.value })}
                  placeholder="surname"
                  autoComplete="family-name"
                  style={baseInputStyle}
                  {...focusHandlers}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <FieldLabel text={t('phone')} />
              <input
                value={form.phone_number}
                onChange={e => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+998901234567"
                autoComplete="tel"
                inputMode="tel"
                style={{
                  ...baseInputStyle,
                  borderColor: form.phone_number && !form.phone_number.startsWith('+') ? '#f87171' : undefined,
                }}
                {...focusHandlers}
              />
              {form.phone_number && !form.phone_number.startsWith('+') && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#dc2626' }}>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('phoneInvalid')}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <FieldLabel text={t('password')} />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ ...baseInputStyle, paddingRight: 48 }}
                  {...focusHandlers}
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {form.password && form.password.length < 8 && (
                <p className="text-xs mt-1.5" style={{ color: '#f59e0b' }}>
                  {t('passwordShort')}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <FieldLabel text={t('confirm')} />
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                style={{
                  ...baseInputStyle,
                  borderColor: form.confirm && form.confirm !== form.password ? '#fca5a5' : '#e8e5e0',
                }}
                {...focusHandlers}
              />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs mt-1.5" style={{ color: '#dc2626' }}>
                  {t('passwordMismatch')}
                </p>
              )}
            </div>

            {/* Global error */}
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
                  {t('creating')}
                </>
              ) : t('createBtn')}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 text-center" style={{ borderTop: '1px solid #e8e5e0' }}>
            <p className="text-sm" style={{ color: '#888' }}>
              {t('alreadyHave')}{' '}
              <Link
                to="/login"
                className="font-bold transition-colors"
                style={{ color: '#1a2f4e' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#1a2f4e')}
              >
                {t('signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
