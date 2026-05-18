import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { forgotPassword } from '../api/auth'
import { useLang } from '../store/lang'
import { extractApiError } from '../api/errors'

const baseInputStyle: React.CSSProperties = {
  background: '#f7f5f2',
  border: '1.5px solid #e8e5e0',
  color: '#1a2f4e',
  borderRadius: 12,
  padding: '13px 16px',
  fontSize: 16,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s, background 0.15s',
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', new_password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { t } = useLang()

  const mutation = useMutation({
    mutationFn: () => forgotPassword(form.name, form.new_password),
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    },
    onError: (err: unknown) => {
      setError(extractApiError(err, 'Failed to reset password.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.new_password) { setError(t('allRequired')); return }
    if (form.new_password !== form.confirm) { setError(t('passwordMismatch')); return }
    if (form.new_password.length < 8) { setError(t('passwordShort')); return }
    mutation.mutate()
  }

  const FieldLabel = ({ text }: { text: string }) => (
    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(10,10,15,0.38)' }}>
      {text}
    </label>
  )

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
          <p className="text-sm mt-1.5 max-w-xs mx-auto" style={{ color: '#888' }}>{t('resetSub')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}>
          {success ? (
            /* Success state */
            <div className="text-center py-6">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#22c55e' }} />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="font-bold text-base sm:text-lg" style={{ color: '#1a2f4e' }}>{t('passwordUpdated')}</p>
              <p className="text-sm mt-1.5" style={{ color: '#888' }}>{t('redirecting')}</p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <FieldLabel text={t('username')} />
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="your_username"
                  autoComplete="username"
                  style={baseInputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.background = '#f7f5f2' }}
                />
              </div>

              <div>
                <FieldLabel text={t('newPassword')} />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.new_password}
                    onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    style={{ ...baseInputStyle, paddingRight: 48 }}
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
              </div>

              <div>
                <FieldLabel text={t('confirm')} />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{
                    ...baseInputStyle,
                    borderColor: form.confirm && form.confirm !== form.new_password ? '#fca5a5' : '#e8e5e0',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e => {
                    const mismatch = form.confirm && form.confirm !== form.new_password
                    e.currentTarget.style.borderColor = mismatch ? '#fca5a5' : '#e8e5e0'
                    e.currentTarget.style.background = '#f7f5f2'
                  }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2.5 text-xs font-medium px-4 py-3 rounded-xl" style={{ background: '#fff0ee', color: '#e03c10', border: '1px solid #ffd5cc' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full text-white rounded-xl font-bold text-sm transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
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
                    {t('resetting')}
                  </>
                ) : t('resetBtn')}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 text-center" style={{ borderTop: '1px solid #e8e5e0' }}>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: '#888', minHeight: 44 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1a2f4e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
