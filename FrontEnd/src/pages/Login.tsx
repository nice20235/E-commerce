import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { useLang } from '../store/lang'
import { extractApiError } from '../api/errors'

const inp = {
  background: '#f7f5f2',
  border: '1.5px solid #e8e5e0',
  color: '#1a2f4e',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

export default function Login() {
  const { setAuth, isAuthenticated, user } = useAuthStore()
  const { t } = useLang()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from
  const [form, setForm] = useState({ name: '', password: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => { setAuth(data.user) },
    onError: (err: unknown) => {
      setError(extractApiError(err, 'Login failed.'))
    },
  })

  if (isAuthenticated) {
    const dest = from || (user?.is_admin ? '/admin' : '/')
    return <Navigate to={dest} replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!form.name || !form.password) { setError(t('allRequired')); return }
    mutation.mutate(form)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5" style={{ background: '#1a2f4e' }}>
            <span className="font-black text-2xl" style={{ color: '#ff4d1c' }}>S</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#1a2f4e' }}>{t('welcomeBack')}</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{t('signInSub')}</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(10,10,15,0.45)' }}>
                {t('username')}
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="your_username"
                style={inp}
                onFocus={e => e.currentTarget.style.borderColor = '#1a2f4e'}
                onBlur={e => e.currentTarget.style.borderColor = '#e8e5e0'}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(10,10,15,0.45)' }}>
                {t('password')}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={inp}
                onFocus={e => e.currentTarget.style.borderColor = '#1a2f4e'}
                onBlur={e => e.currentTarget.style.borderColor = '#e8e5e0'}
              />
            </div>

            {error && (
              <div className="text-xs font-medium px-4 py-3 rounded-xl" style={{ background: '#fff0ee', color: '#e03c10', border: '1px solid #ffd5cc' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={mutation.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all mt-1 disabled:opacity-50"
              style={{ background: '#1a2f4e' }}
              onMouseEnter={e => e.currentTarget.style.background = '#ff4d1c'}
              onMouseLeave={e => e.currentTarget.style.background = '#1a2f4e'}
            >
              {mutation.isPending ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center space-y-2" style={{ borderTop: '1px solid #e8e5e0' }}>
            <p className="text-sm" style={{ color: '#888' }}>
              {t('noAccount')}{' '}
              <Link to="/register" className="font-semibold" style={{ color: '#1a2f4e' }}>{t('createOne')}</Link>
            </p>
            <Link to="/forgot-password" className="text-xs block" style={{ color: '#bbb' }}>{t('forgotPassword')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
