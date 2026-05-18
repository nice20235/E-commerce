import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, deleteUser } from '../../api/users'
import { useLang } from '../../store/lang'
import type { UserListItem } from '../../types'

export default function AdminUsers() {
  const { lang } = useLang()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => getUsers(0, 100, search || undefined),
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmDelete(null)
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const L = (uz: string, ru: string) => lang === 'uz' ? uz : ru

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#1a2f4e' }}>
            {L('Foydalanuvchilar', 'Пользователи')}
          </h1>
          {data && (
            <p className="text-sm mt-0.5" style={{ color: '#888' }}>
              {data.total} {L('ta foydalanuvchi', 'пользователей')}
            </p>
          )}
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#bbb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={L('Ism, familiya, telefon...', 'Имя, фамилия, телефон...')}
            className="w-full pl-10 pr-4 rounded-xl transition-all"
            style={{ background: '#fff', border: '1.5px solid #e8e5e0', color: '#1a2f4e', outline: 'none', height: 44, fontSize: 16 }}
            onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')}
          />
        </div>
        <button
          type="submit"
          className="px-4 rounded-xl text-sm font-semibold text-white transition-all flex-shrink-0"
          style={{ background: '#1a2f4e', height: 44 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
        >
          {L('Qidirish', 'Поиск')}
        </button>
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setSearch(''); setSearchInput('') }}
            className="flex items-center justify-center rounded-xl text-sm transition-all flex-shrink-0"
            style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', width: 44, height: 44 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff4d1c'; e.currentTarget.style.color = '#ff4d1c' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>

        {/* Skeleton rows */}
        {isLoading && (
          <div className="divide-y" style={{ borderColor: '#f7f5f2' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 shimmer rounded w-1/3" />
                  <div className="h-3 shimmer rounded w-1/4" />
                </div>
                <div className="h-5 shimmer rounded-full w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && data?.items.length === 0 && (
          <div className="px-5 py-14 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f0ede8' }}>
              <svg className="w-7 h-7" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#888' }}>
              {L('Foydalanuvchilar topilmadi', 'Пользователи не найдены')}
            </p>
          </div>
        )}

        {/* Desktop table — proper <table> for guaranteed alignment */}
        {!isLoading && !!data?.items.length && (
          <table className="hidden sm:table w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e5e0' }}>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: '#bbb', width: '3rem' }}>#</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-3 py-3.5" style={{ color: '#bbb' }}>{L('Ism', 'Имя')}</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-3 py-3.5" style={{ color: '#bbb' }}>{L('Familiya', 'Фамилия')}</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-3 py-3.5" style={{ color: '#bbb' }}>{L('Telefon', 'Телефон')}</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: '#bbb', width: '16rem' }}>{L('Rol va amal', 'Роль и действие')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user: UserListItem, idx: number) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: idx < (data.items.length - 1) ? '1px solid #f7f5f2' : 'none',
                    background: confirmDelete === user.id ? '#fef2f2' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (confirmDelete !== user.id) e.currentTarget.style.background = '#faf9f7' }}
                  onMouseLeave={e => { if (confirmDelete !== user.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono" style={{ color: '#ddd' }}>{idx + 1}</span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                        style={{
                          background: user.is_admin ? 'rgba(255,77,28,0.12)' : '#f0ede8',
                          color: user.is_admin ? '#ff4d1c' : '#888',
                        }}
                      >
                        {(user.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm truncate" style={{ color: '#1a2f4e' }}>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="text-sm" style={{ color: '#555' }}>{user.surname}</span>
                  </td>
                  <td className="px-3 py-4">
                    <span className="text-sm font-mono" style={{ color: '#555' }}>{user.phone_number}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      {user.is_admin ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(255,77,28,0.1)', color: '#ff4d1c' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ff4d1c' }} />
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: '#f0ede8', color: '#888' }}>
                          {L('Foydalanuvchi', 'Польз.')}
                        </span>
                      )}
                      {confirmDelete === user.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteMutation.mutate(user.id)}
                            disabled={deleteMutation.isPending}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all text-white disabled:opacity-50"
                            style={{ background: '#dc2626', minHeight: 34 }}
                          >
                            {L('Ha', 'Да')}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ border: '1px solid #e8e5e0', color: '#888', background: '#fff', minHeight: 34 }}
                          >
                            {L("Yo'q", 'Нет')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium transition-all px-3 py-1.5 rounded-lg flex-shrink-0"
                          style={{ color: '#dc2626', background: 'transparent', minHeight: 34 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {L("O'chirish", 'Удалить')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Mobile card layout */}
        {!isLoading && data?.items.map((user: UserListItem, idx: number) => (
          <div
            key={`mob-${user.id}`}
            className="sm:hidden flex items-center gap-3 px-4 py-4 transition-colors"
            style={{ borderBottom: idx < (data.items.length - 1) ? '1px solid #f7f5f2' : 'none' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{
                background: user.is_admin ? 'rgba(255,77,28,0.12)' : '#f0ede8',
                color: user.is_admin ? '#ff4d1c' : '#888',
              }}
            >
              {(user.name?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: '#1a2f4e' }}>{user.name} {user.surname}</p>
              <p className="text-xs mt-0.5" style={{ color: '#888' }}>{user.phone_number}</p>
            </div>
            {/* Role badge + delete button — always side by side with clear gap */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {user.is_admin && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: 'rgba(255,77,28,0.1)', color: '#ff4d1c' }}>
                  Admin
                </span>
              )}
              {confirmDelete === user.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteMutation.mutate(user.id)}
                    disabled={deleteMutation.isPending}
                    className="text-xs px-3 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center"
                    style={{ background: '#dc2626', minHeight: 44 }}
                  >
                    {L('Ha', 'Да')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs px-3 rounded-xl flex items-center justify-center"
                    style={{ border: '1px solid #e8e5e0', color: '#888', background: '#fff', minHeight: 44 }}
                  >
                    {L("Yo'q", 'Нет')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(user.id)}
                  className="flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
                  style={{ color: '#dc2626', width: 44, height: 44 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
