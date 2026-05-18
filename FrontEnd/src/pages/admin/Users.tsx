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

  const label = (uz: string, ru: string) => lang === 'uz' ? uz : ru

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black" style={{ color: '#1a2f4e' }}>
          {label('Foydalanuvchilar', 'Пользователи')}
          {data && (
            <span className="ml-2 text-sm font-normal" style={{ color: '#888' }}>
              ({data.total})
            </span>
          )}
        </h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-sm">
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder={label('Ism, familiya, telefon...', 'Имя, фамилия, телефон...')}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#fff', border: '1.5px solid #e8e5e0', color: '#1a2f4e', outline: 'none' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')}
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: '#1a2f4e' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
        >
          {label('Qidirish', 'Поиск')}
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput('') }}
            className="px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ border: '1.5px solid #e8e5e0', color: '#888' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' }}
          >
            ✕
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        {/* Table header */}
        <div
          className="grid text-xs font-bold uppercase tracking-wider px-5 py-3"
          style={{
            gridTemplateColumns: '2rem 1fr 1fr 1fr 6rem 5rem',
            color: '#aaa',
            borderBottom: '1px solid #f0ede8',
          }}
        >
          <span>#</span>
          <span>{label('Ism', 'Имя')}</span>
          <span>{label('Familiya', 'Фамилия')}</span>
          <span>{label('Telefon', 'Телефон')}</span>
          <span>{label('Rol', 'Роль')}</span>
          <span className="text-right">{label('O\'chirish', 'Удалить')}</span>
        </div>

        {isLoading && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: '#888' }}>
            {label('Yuklanmoqda...', 'Загрузка...')}
          </div>
        )}

        {data?.items.length === 0 && !isLoading && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: '#888' }}>
            {label('Foydalanuvchilar topilmadi', 'Пользователи не найдены')}
          </div>
        )}

        {data?.items.map((user: UserListItem, idx: number) => (
          <div
            key={user.id}
            className="grid items-center px-5 py-3.5 transition-colors"
            style={{
              gridTemplateColumns: '2rem 1fr 1fr 1fr 6rem 5rem',
              borderBottom: idx < (data.items.length - 1) ? '1px solid #f7f5f2' : 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fafaf9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="text-xs" style={{ color: '#ccc' }}>{idx + 1}</span>

            <span className="font-semibold text-sm truncate pr-3" style={{ color: '#1a2f4e' }}>
              {user.name}
            </span>

            <span className="text-sm truncate pr-3" style={{ color: '#555' }}>
              {user.surname}
            </span>

            <span className="text-sm font-mono" style={{ color: '#555' }}>
              {user.phone_number}
            </span>

            <span>
              {user.is_admin ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,77,28,0.1)', color: '#ff4d1c' }}>
                  Admin
                </span>
              ) : (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#f0ede8', color: '#888' }}>
                  {label('Foydalanuvchi', 'Польз.')}
                </span>
              )}
            </span>

            <div className="flex items-center justify-end gap-3">
              {/* Delete */}
              {confirmDelete === user.id ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => deleteMutation.mutate(user.id)}
                    disabled={deleteMutation.isPending}
                    className="text-xs px-2 py-1 rounded-lg font-semibold transition-all"
                    style={{ background: '#dc2626', color: '#fff' }}
                  >
                    {label('Ha', 'Да')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ border: '1px solid #e8e5e0', color: '#888' }}
                  >
                    {label('Yo\'q', 'Нет')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(user.id)}
                  className="text-xs transition-colors"
                  style={{ color: '#dc2626' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {label('O\'chirish', 'Удалить')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
