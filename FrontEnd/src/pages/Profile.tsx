import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateMe } from '../api/users'
import { useAuthStore } from '../store/auth'
import { useLang } from '../store/lang'
import { extractApiError } from '../api/errors'

const inp = {
  background: '#f7f5f2',
  border: '1.5px solid #e8e5e0',
  color: '#1a2f4e',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
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

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-8" style={{ color: '#1a2f4e' }}>{t('profileTitle')}</h1>

      {/* User badge */}
      <div className="flex items-center gap-4 rounded-3xl p-5 mb-6" style={{ background: '#1a2f4e' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
          style={{ background: 'rgba(255,77,28,0.2)', color: '#ff4d1c' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-white">{user?.name} {user?.surname}</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.phone_number}</p>
          {user?.is_admin && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1"
              style={{ background: 'rgba(255,77,28,0.2)', color: '#ff4d1c' }}>Admin</span>
          )}
        </div>
      </div>

      {/* Info form */}
      <div className="rounded-3xl p-6 mb-4" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-5" style={{ color: 'rgba(10,10,15,0.4)' }}>
          {t('profileInfo')}
        </h2>
        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>
                {t('username')}
              </label>
              <input value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>
                {t('surname')}
              </label>
              <input value={info.surname} onChange={e => setInfo({ ...info, surname: e.target.value })} style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>
              {t('phone')}
            </label>
            <input value={info.phone_number} onChange={e => setInfo({ ...info, phone_number: e.target.value })} style={inp}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')} />
          </div>

          {infoError && <p className="text-xs font-medium" style={{ color: '#e03c10' }}>{infoError}</p>}
          {infoSuccess && <p className="text-xs font-medium" style={{ color: '#16a34a' }}>{infoSuccess}</p>}

          <button type="submit" disabled={infoMutation.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: '#1a2f4e' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#ff4d1c' }}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
          >
            {infoMutation.isPending ? t('saving') : t('saveChanges')}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="rounded-3xl p-6" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-5" style={{ color: 'rgba(10,10,15,0.4)' }}>
          {t('changePassword')}
        </h2>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>
              {t('currentPassword')}
            </label>
            <input type="password" value={pw.current_password}
              onChange={e => setPw({ ...pw, current_password: e.target.value })}
              placeholder="••••••••" style={inp}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>
              {t('newPasswordLabel')}
            </label>
            <input type="password" value={pw.new_password}
              onChange={e => setPw({ ...pw, new_password: e.target.value })}
              placeholder="••••••••" style={inp}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>
              {t('confirmNewPassword')}
            </label>
            <input type="password" value={pw.confirm_new_password}
              onChange={e => setPw({ ...pw, confirm_new_password: e.target.value })}
              placeholder="••••••••" style={inp}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')} />
          </div>

          {pwError && <p className="text-xs font-medium" style={{ color: '#e03c10' }}>{pwError}</p>}
          {pwSuccess && <p className="text-xs font-medium" style={{ color: '#16a34a' }}>{pwSuccess}</p>}

          <button type="submit" disabled={pwMutation.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: '#1a2f4e' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#ff4d1c' }}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
          >
            {pwMutation.isPending ? t('saving') : t('changePassword')}
          </button>
        </form>
      </div>
    </div>
  )
}
