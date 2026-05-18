import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateMe } from '../api/users'
import { useAuthStore } from '../store/auth'
import { useLang } from '../store/lang'
import { extractApiError } from '../api/errors'

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

function FieldLabel({ text }: { text: string }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(10,10,15,0.38)' }}>
      {text}
    </label>
  )
}

function Alert({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className="flex items-center gap-2.5 text-xs font-medium px-4 py-3 rounded-xl"
      style={{
        background: type === 'success' ? '#f0fdf4' : '#fff0ee',
        color: type === 'success' ? '#166534' : '#e03c10',
        border: `1px solid ${type === 'success' ? '#bbf7d0' : '#ffd5cc'}`,
      }}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {type === 'success' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
      </svg>
      {message}
    </div>
  )
}

export default function Profile() {
  const { user, setAuth } = useAuthStore()
  const { t } = useLang()

  const [info, setInfo] = useState({
    name: user?.name ?? '',
    surname: user?.surname ?? '',
    phone_number: user?.phone_number ?? '',
  })
  const [infoSuccess, setInfoSuccess] = useState('')
  const [infoError, setInfoError] = useState('')

  const [pw, setPw] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  })
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  const infoMutation = useMutation({
    mutationFn: () => updateMe({ name: info.name, surname: info.surname, phone_number: info.phone_number }),
    onSuccess: (updated) => {
      if (user) {
        setAuth({ ...user, name: updated.name, surname: updated.surname, phone_number: updated.phone_number })
      }
      setInfoSuccess(t('savedSuccess'))
      setInfoError('')
      setTimeout(() => setInfoSuccess(''), 3000)
    },
    onError: (err: unknown) => {
      setInfoError(extractApiError(err, 'Failed to save'))
      setInfoSuccess('')
    },
  })

  const pwMutation = useMutation({
    mutationFn: () => updateMe({
      current_password: pw.current_password,
      new_password: pw.new_password,
      confirm_new_password: pw.confirm_new_password,
    }),
    onSuccess: () => {
      setPwSuccess(t('passwordChanged'))
      setPwError('')
      setPw({ current_password: '', new_password: '', confirm_new_password: '' })
      setTimeout(() => setPwSuccess(''), 3000)
    },
    onError: (err: unknown) => {
      setPwError(extractApiError(err, 'Failed to change password'))
      setPwSuccess('')
    },
  })

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInfoError('')
    if (!info.name || !info.surname) { setInfoError(t('allRequired')); return }
    infoMutation.mutate()
  }

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (!pw.current_password) { setPwError(t('currentPassRequired')); return }
    if (!pw.new_password) { setPwError(t('newPassRequired')); return }
    if (pw.new_password.length < 8) { setPwError(t('passMinLength')); return }
    if (pw.new_password !== pw.confirm_new_password) { setPwError(t('passMismatch')); return }
    pwMutation.mutate()
  }

  const initials = [user?.name?.[0], user?.surname?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8" style={{ color: '#1a2f4e' }}>{t('profileTitle')}</h1>

      {/* User badge */}
      <div
        className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)', boxShadow: '0 8px 32px rgba(26,47,78,0.25)' }}
      >
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,77,28,0.12)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div className="relative flex items-center gap-3 sm:gap-4">
          {/* Avatar */}
          <div
            className="rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{
              width: 60,
              height: 60,
              background: 'rgba(255,77,28,0.18)',
              color: '#ff7a50',
              border: '1.5px solid rgba(255,77,28,0.25)',
              textShadow: '0 2px 8px rgba(255,77,28,0.3)',
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base sm:text-lg leading-tight truncate">{user?.name} {user?.surname}</p>
            <p className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {user?.phone_number}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {user?.is_admin ? (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,77,28,0.2)', color: '#ff7a50', border: '1px solid rgba(255,77,28,0.25)' }}
                >
                  Admin
                </span>
              ) : (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Member
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile info form */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4" style={{ background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2 mb-5 sm:mb-6">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#f0ede8' }}>
            <svg className="w-3.5 h-3.5" style={{ color: '#888' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="font-bold text-sm" style={{ color: '#1a2f4e' }}>{t('profileInfo')}</h2>
        </div>

        <form onSubmit={handleInfoSubmit} className="space-y-4">
          {/* Stack on mobile, grid on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel text={t('username')} />
              <input
                value={info.name}
                onChange={e => setInfo({ ...info, name: e.target.value })}
                style={baseInputStyle}
                {...focusHandlers}
              />
            </div>
            <div>
              <FieldLabel text={t('surname')} />
              <input
                value={info.surname}
                onChange={e => setInfo({ ...info, surname: e.target.value })}
                style={baseInputStyle}
                {...focusHandlers}
              />
            </div>
          </div>
          <div>
            <FieldLabel text={t('phone')} />
            <input
              value={info.phone_number}
              onChange={e => setInfo({ ...info, phone_number: e.target.value })}
              inputMode="tel"
              style={baseInputStyle}
              {...focusHandlers}
            />
          </div>

          {infoError && <Alert message={infoError} type="error" />}
          {infoSuccess && <Alert message={infoSuccess} type="success" />}

          <button
            type="submit"
            disabled={infoMutation.isPending}
            className="w-full rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #1a2f4e, #243c61)',
              boxShadow: '0 4px 14px rgba(26,47,78,0.2)',
              height: 48,
            }}
            onMouseEnter={e => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(255,77,28,0.35)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1a2f4e, #243c61)'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,47,78,0.2)'
            }}
          >
            {infoMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                </svg>
                {t('saving')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('saveChanges')}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change password form */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6" style={{ background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2 mb-5 sm:mb-6">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#f0ede8' }}>
            <svg className="w-3.5 h-3.5" style={{ color: '#888' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-bold text-sm" style={{ color: '#1a2f4e' }}>{t('changePassword')}</h2>
        </div>

        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <FieldLabel text={t('currentPassword')} />
            <input
              type="password"
              value={pw.current_password}
              onChange={e => setPw({ ...pw, current_password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
              style={baseInputStyle}
              {...focusHandlers}
            />
          </div>
          <div>
            <FieldLabel text={t('newPasswordLabel')} />
            <input
              type="password"
              value={pw.new_password}
              onChange={e => setPw({ ...pw, new_password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              style={baseInputStyle}
              {...focusHandlers}
            />
          </div>
          <div>
            <FieldLabel text={t('confirmNewPassword')} />
            <input
              type="password"
              value={pw.confirm_new_password}
              onChange={e => setPw({ ...pw, confirm_new_password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              style={baseInputStyle}
              {...focusHandlers}
            />
          </div>

          {pwError && <Alert message={pwError} type="error" />}
          {pwSuccess && <Alert message={pwSuccess} type="success" />}

          <button
            type="submit"
            disabled={pwMutation.isPending}
            className="w-full rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #1a2f4e, #243c61)',
              boxShadow: '0 4px 14px rgba(26,47,78,0.2)',
              height: 48,
            }}
            onMouseEnter={e => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(255,77,28,0.35)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1a2f4e, #243c61)'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,47,78,0.2)'
            }}
          >
            {pwMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                </svg>
                {t('saving')}
              </>
            ) : t('changePassword')}
          </button>
        </form>
      </div>
    </div>
  )
}
