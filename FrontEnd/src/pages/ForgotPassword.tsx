import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { forgotPassword } from '../api/auth'
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

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', new_password: '', confirm: '' })
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
    if (form.new_password.length < 6) { setError(t('passwordShort')); return }
    mutation.mutate()
  }

  const label = (text: string) => (
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>{text}</label>
  )

  return (
    <div className="min-h-[82vh] flex items-center justify-center">
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5" style={{ background: '#1a2f4e' }}>
            <span className="font-black text-xl">🔑</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#1a2f4e' }}>{t('resetPassword')}</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{t('resetSub')}</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
                <svg className="w-7 h-7" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold" style={{ color: '#1a2f4e' }}>{t('passwordUpdated')}</p>
              <p className="text-sm mt-1" style={{ color: '#888' }}>{t('redirecting')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>{label(t('username'))}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="your_username" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>
              <div>{label(t('newPassword'))}<input type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} placeholder="••••••••" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>
              <div>{label(t('confirm'))}<input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>

              {error && (
                <div className="text-xs font-medium px-4 py-3 rounded-xl" style={{ background: '#fff0ee', color: '#e03c10', border: '1px solid #ffd5cc' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full text-white py-3.5 rounded-xl font-bold text-sm transition-all mt-2 disabled:opacity-50"
                style={{ background: '#1a2f4e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#ff4d1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a2f4e'}
              >
                {mutation.isPending ? t('resetting') : t('resetBtn')}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #e8e5e0' }}>
            <Link to="/login" className="text-sm transition-colors" style={{ color: '#888' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888')}
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
