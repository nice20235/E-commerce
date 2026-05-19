import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImages } from '../../api/products'
import type { Product } from '../../types'
import { useLang } from '../../store/lang'
import { extractApiError } from '../../api/errors'
import { getImageUrl } from '../../utils/image'

interface FormData { name: string; size: string; price: string; quantity: string }
const emptyForm: FormData = { name: '', size: '', price: '', quantity: '' }

const baseInputStyle: React.CSSProperties = {
  background: '#f7f5f2',
  border: '1.5px solid #e8e5e0',
  color: '#1a2f4e',
  borderRadius: 10,
  padding: '10px 12px',
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

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormData>(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const LIMIT = 10
  const { t } = useLang()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => getProducts({ skip: (page - 1) * LIMIT, limit: LIMIT, sort: 'id_desc' }),
  })

  const createMutation = useMutation({
    mutationFn: () => createProduct({
      name: form.name,
      size: form.size,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' })
      setForm(emptyForm)
      setShowForm(false)
      setError('')
    },
    onError: (err: unknown) => setError(extractApiError(err, 'Failed to create')),
  })

  const updateMutation = useMutation({
    mutationFn: () => updateProduct(editId!, {
      name: form.name,
      size: form.size,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' })
      setForm(emptyForm)
      setEditId(null)
      setShowForm(false)
      setError('')
    },
    onError: (err: unknown) => setError(extractApiError(err, 'Failed to update')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' })
      setDeleteConfirm(null)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) => uploadProductImages(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' })
    },
  })

  const handleEdit = (p: Product) => {
    setEditId(p.id)
    setForm({ name: p.name, size: p.size, price: String(p.price), quantity: String(p.quantity) })
    setShowForm(true)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.size || !form.price || !form.quantity) {
      setError(t('allRequired'))
      return
    }
    editId ? updateMutation.mutate() : createMutation.mutate()
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) uploadMutation.mutate({ id, files })
    e.target.value = ''
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setError('')
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const FieldLabel = ({ text }: { text: string }) => (
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.38)' }}>
      {text}
    </label>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black" style={{ color: '#1a2f4e' }}>{t('adminProducts')}</h1>
          {data && (
            <p className="text-sm mt-0.5" style={{ color: '#888' }}>
              {data.total} {t('products')}
            </p>
          )}
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); setError('') }}
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition-all text-white flex-shrink-0"
          style={{
            background: showForm ? '#888' : 'linear-gradient(135deg, #1a2f4e, #243c61)',
            boxShadow: showForm ? 'none' : '0 4px 14px rgba(26,47,78,0.2)',
            minHeight: 44,
          }}
          onMouseEnter={e => {
            if (!showForm) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(255,77,28,0.35)'
            }
          }}
          onMouseLeave={e => {
            if (!showForm) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1a2f4e, #243c61)'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,47,78,0.2)'
            }
          }}
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('cancel')}
            </>
          ) : (
            t('newProduct')
          )}
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div
          className="rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6 fade-up"
          style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1.5px solid ${editId ? '#dbeafe' : '#e8e5e0'}` }}
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: editId ? '#eff6ff' : '#f0fdf4', color: editId ? '#3b82f6' : '#16a34a' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {editId ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                )}
              </svg>
            </div>
            <h2 className="font-bold text-sm" style={{ color: '#1a2f4e' }}>
              {editId ? t('edit') : t('newProduct')}
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="col-span-1 sm:col-span-2">
                <FieldLabel text={t('name')} />
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Product name"
                  style={baseInputStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <FieldLabel text="Size" />
                <input
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="e.g. 40-41"
                  style={baseInputStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <FieldLabel text={t('price')} />
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  min="0"
                  style={baseInputStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <FieldLabel text={t('stock')} />
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                  style={baseInputStyle}
                  {...focusHandlers}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-3 text-xs font-medium px-3 py-2.5 rounded-xl" style={{ background: '#fff0ee', color: '#e03c10', border: '1px solid #ffd5cc' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-4 sm:mt-5">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 text-white px-4 sm:px-5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #1a2f4e, #243c61)',
                  boxShadow: '0 4px 14px rgba(26,47,78,0.2)',
                  height: 44,
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
                {isPending ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                    </svg>
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editId ? t('update') : t('create')}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 sm:px-5 rounded-xl text-sm font-medium transition-all"
                style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', height: 44 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' }}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table — desktop */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl h-16 shimmer" style={{ background: '#fff' }} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>

          {/* Desktop proper <table> — guarantees column alignment */}
          <table className="hidden sm:table w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e5e0' }}>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: '#aaa', width: '40%' }}>{t('name')}</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-3 py-3.5" style={{ color: '#aaa', width: '12%' }}>Size</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-3 py-3.5" style={{ color: '#aaa', width: '17%' }}>{t('price')}</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-3 py-3.5" style={{ color: '#aaa', width: '11%' }}>{t('stock')}</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: '#aaa', width: '20%' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((product, idx) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: idx < (data.items.length - 1) ? '1px solid rgba(232,229,224,0.5)' : 'none',
                    background: deleteConfirm === product.id ? '#fef2f2' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (deleteConfirm !== product.id) e.currentTarget.style.background = '#faf9f7' }}
                  onMouseLeave={e => { if (deleteConfirm !== product.id) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Name + image */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image ? (
                        <img src={getImageUrl(product.image)} alt={product.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ background: '#f0ede8' }} />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0ede8' }}>
                          <svg className="w-5 h-5" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-semibold text-sm truncate" style={{ color: '#1a2f4e', maxWidth: 160 }}>{product.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-sm" style={{ color: '#888' }}>{product.size}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: '#1a2f4e' }}>
                      {product.price.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-3 py-3.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg inline-block" style={{
                      background: product.quantity > 5 ? '#f0fdf4' : product.quantity > 0 ? '#fff7ed' : '#fef2f2',
                      color: product.quantity > 5 ? '#166534' : product.quantity > 0 ? '#c2410c' : '#dc2626',
                    }}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {deleteConfirm === product.id ? (
                        <>
                          <button
                            onClick={() => deleteMutation.mutate(product.id)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all text-white disabled:opacity-50"
                            style={{ background: '#dc2626', minHeight: 36 }}
                          >
                            {t('delete')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ border: '1px solid #e8e5e0', color: '#888', background: '#fff', minHeight: 36 }}
                          >
                            {t('cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <label
                            className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: '#eff6ff', color: '#3b82f6', border: '1.5px solid #dbeafe', minHeight: 36 }}
                            title={t('photo')}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.color = '#1d4ed8' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6' }}
                          >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t('photo')}
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e, product.id)} />
                          </label>
                          <button
                            onClick={() => handleEdit(product)}
                            className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            style={{ border: '1.5px solid #e8e5e0', color: '#1a2f4e', background: '#fff', minHeight: 36 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f7f5f2'; e.currentTarget.style.borderColor = '#1a2f4e' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e8e5e0' }}
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            style={{ border: '1.5px solid #fecaca', color: '#dc2626', background: '#fef2f2', minHeight: 36 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca' }}
                          >
                            {t('delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y" style={{ borderColor: '#f7f5f2' }}>
            {data?.items.map((product, idx) => (
              <div
                key={`mob-${product.id}`}
                className="p-4 transition-colors"
                style={{ background: deleteConfirm === product.id ? '#fef2f2' : 'transparent', borderBottom: idx < (data.items.length - 1) ? '1px solid #f7f5f2' : 'none' }}
              >
                {/* Top row: image + name + stock */}
                <div className="flex items-center gap-3 mb-3">
                  {product.image ? (
                    <img src={getImageUrl(product.image)} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" style={{ background: '#f0ede8' }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0ede8' }}>
                      <svg className="w-6 h-6" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1a2f4e' }}>{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: '#888' }}>Size {product.size}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{
                        background: product.quantity > 5 ? '#f0fdf4' : product.quantity > 0 ? '#fff7ed' : '#fef2f2',
                        color: product.quantity > 5 ? '#166534' : product.quantity > 0 ? '#c2410c' : '#dc2626',
                      }}>
                        {product.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: '#1a2f4e' }}>{product.price.toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions row */}
                {deleteConfirm === product.id ? (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => deleteMutation.mutate(product.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 flex items-center justify-center rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all"
                      style={{ background: '#dc2626', minHeight: 44, padding: '12px 12px' }}
                    >
                      {t('delete')}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 flex items-center justify-center rounded-xl text-xs font-semibold transition-all"
                      style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', minHeight: 44, padding: '12px 12px' }}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <label
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      style={{ border: '1.5px solid #dbeafe', color: '#3b82f6', background: '#eff6ff', minHeight: 44, padding: '12px 8px' }}
                    >
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('photo')}
                      <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e, product.id)} />
                    </label>
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center rounded-xl text-xs font-semibold transition-all"
                      style={{ border: '1.5px solid #e8e5e0', color: '#1a2f4e', background: '#fff', minHeight: 44, padding: '12px 8px' }}
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="flex-1 flex items-center justify-center rounded-xl text-xs font-semibold transition-all"
                      style={{ border: '1.5px solid #fecaca', color: '#dc2626', background: '#fef2f2', minHeight: 44, padding: '12px 8px' }}
                    >
                      {t('delete')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {data?.items.length === 0 && (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f0ede8' }}>
                <svg className="w-7 h-7" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#888' }}>No products yet</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex justify-center gap-2 p-4" style={{ borderTop: '1px solid rgba(232,229,224,0.5)' }}>
              <button
                disabled={!data.has_prev}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl font-medium transition-all disabled:opacity-40"
                style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', padding: '10px 18px', fontSize: 14, minHeight: 44 }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a2f4e' } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e8e5e0' }}
              >
                {t('prev')}
              </button>
              <span className="rounded-xl font-medium flex items-center justify-center" style={{ background: '#f7f5f2', color: '#888', padding: '10px 18px', fontSize: 14 }}>
                {data.page} / {data.pages}
              </span>
              <button
                disabled={!data.has_next}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl font-medium transition-all disabled:opacity-40"
                style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', padding: '10px 18px', fontSize: 14, minHeight: 44 }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a2f4e' } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e8e5e0' }}
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
