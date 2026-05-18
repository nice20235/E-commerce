import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { register } from '../api/auth'
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

export default function Register() {
  const { setAuth, isAuthenticated } = useAuthStore()
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', surname: '', phone_number: '', password: '', confirm: '' })
  const [error, setError] = useState('')

  // ALL hooks must be before any conditional return
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => { setAuth(data.user) },
    onError: (err: unknown) => {
      setError(extractApiError(err, 'Registration failed.'))
    },
  })

  // After all hooks — conditional redirect
  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const { name, surname, phone_number, password, confirm } = form
    if (!name || !surname || !phone_number || !password) { setError(t('allRequired')); return }
    if (password !== confirm) { setError(t('passwordMismatch')); return }
    if (password.length < 8) { setError(t('passwordShort')); return }
    mutation.mutate({ name, surname, phone_number, password, confirm_password: confirm })
  }

  const label = (text: string) => (
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>{text}</label>
  )

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-10">
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5" style={{ background: '#1a2f4e' }}>
            <span className="font-black text-2xl" style={{ color: '#ff4d1c' }}>S</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#1a2f4e' }}>{t('createAccount')}</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{t('joinSub')}</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>{label(t('username'))}<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="username" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>
              <div>{label(t('surname'))}<input value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} placeholder="surname" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>
            </div>
            <div>{label(t('phone'))}<input value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} placeholder="+998901234567" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>
            <div>{label(t('password'))}<input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>
            <div>{label(t('confirm'))}<input type="password" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} placeholder="••••••••" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} /></div>

            {error && <div className="text-xs font-medium px-4 py-3 rounded-xl" style={{ background: '#fff0ee', color: '#e03c10', border: '1px solid #ffd5cc' }}>{error}</div>}

            <button type="submit" disabled={mutation.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all mt-1 disabled:opacity-50"
              style={{ background: '#1a2f4e' }}
              onMouseEnter={e => e.currentTarget.style.background = '#ff4d1c'}
              onMouseLeave={e => e.currentTarget.style.background = '#1a2f4e'}
            >
              {mutation.isPending ? t('creating') : t('createBtn')}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #e8e5e0' }}>
            <p className="text-sm" style={{ color: '#888' }}>{t('alreadyHave')}{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#1a2f4e' }}>{t('signIn')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
