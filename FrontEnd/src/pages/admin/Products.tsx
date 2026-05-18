import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImages } from '../../api/products'
import type { Product } from '../../types'
import { useLang } from '../../store/lang'
import { extractApiError } from '../../api/errors'

interface FormData { name: string; size: string; price: string; quantity: string }
const emptyForm: FormData = { name: '', size: '', price: '', quantity: '' }

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormData>(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 10
  const { t } = useLang()

  const inp = {
    background: '#f7f5f2',
    border: '1.5px solid #e8e5e0',
    color: '#1a2f4e',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => getProducts({ skip: (page - 1) * LIMIT, limit: LIMIT, sort: 'id_desc' }),
  })

  const createMutation = useMutation({
    mutationFn: () => createProduct({ name: form.name, size: form.size, price: parseFloat(form.price), quantity: parseInt(form.quantity) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); setForm(emptyForm); setShowForm(false); setError('') },
    onError: (err: unknown) => setError(extractApiError(err, 'Failed to create')),
  })

  const updateMutation = useMutation({
    mutationFn: () => updateProduct(editId!, { name: form.name, size: form.size, price: parseFloat(form.price), quantity: parseInt(form.quantity) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); setForm(emptyForm); setEditId(null); setShowForm(false); setError('') },
    onError: (err: unknown) => setError(extractApiError(err, 'Failed to update')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); queryClient.invalidateQueries({ queryKey: ['products'] }) },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) => uploadProductImages(id, files),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); queryClient.invalidateQueries({ queryKey: ['products'] }) },
  })

  const handleEdit = (p: Product) => {
    setEditId(p.id)
    setForm({ name: p.name, size: p.size, price: String(p.price), quantity: String(p.quantity) })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.size || !form.price || !form.quantity) { setError(t('allRequired')); return }
    editId ? updateMutation.mutate() : createMutation.mutate()
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) uploadMutation.mutate({ id, files })
    e.target.value = ''
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black" style={{ color: '#1a2f4e' }}>{t('adminProducts')}
          {data && <span className="ml-2 text-sm font-normal" style={{ color: '#888' }}>({data.total})</span>}
        </h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); setError('') }}
          className="text-sm font-semibold px-4 py-2 rounded-xl transition-all text-white"
          style={{ background: '#1a2f4e' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
        >
          {showForm ? t('cancel') : t('newProduct')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 mb-6 fade-up" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h2 className="font-bold mb-4" style={{ color: '#1a2f4e' }}>{editId ? t('edit') : t('newProduct')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>{t('name')}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>Size</label>
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. 40-41" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>{t('price')}</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" min="0" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(10,10,15,0.4)' }}>{t('stock')}</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" min="0" style={inp} onFocus={e=>e.currentTarget.style.borderColor='#1a2f4e'} onBlur={e=>e.currentTarget.style.borderColor='#e8e5e0'} />
            </div>
          </div>
          {error && <p className="mt-3 text-xs font-medium" style={{ color: '#e03c10' }}>{error}</p>}
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={isPending}
              className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: '#1a2f4e' }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#ff4d1c' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1a2f4e' }}
            >
              {isPending ? t('saving') : editId ? t('update') : t('create')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="px-5 py-2.5 rounded-xl text-sm transition-all"
              style={{ border: '1.5px solid #e8e5e0', color: '#888' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' }}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl h-16 shimmer" style={{ background: '#fff' }} />)}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e5e0' }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{t('name')}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Size</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{t('price')}</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{t('stock')}</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((product) => (
                <tr key={product.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(232,229,224,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#faf9f7')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-xl object-cover" style={{ background: '#f0ede8' }} />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: '#f0ede8' }}>🥿</div>
                      )}
                      <span className="font-semibold" style={{ color: '#1a2f4e' }}>{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4" style={{ color: '#888' }}>{product.size}</td>
                  <td className="px-4 py-4 font-semibold" style={{ color: '#1a2f4e' }}>{product.price.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{
                      background: product.quantity > 0 ? '#f0fdf4' : '#fef2f2',
                      color: product.quantity > 0 ? '#166534' : '#dc2626',
                    }}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <label className="cursor-pointer text-xs font-medium transition-colors" style={{ color: '#3b82f6' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#3b82f6')}
                      >
                        {t('photo')}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e, product.id)} />
                      </label>
                      <button onClick={() => handleEdit(product)} className="text-xs font-medium transition-colors" style={{ color: '#888' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1a2f4e')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                      >{t('edit')}</button>
                      <button
                        onClick={() => { if (confirm(t('deleteConfirm'))) deleteMutation.mutate(product.id) }}
                        className="text-xs font-medium transition-colors" style={{ color: '#f87171' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#f87171')}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.pages > 1 && (
            <div className="flex justify-center gap-2 p-4" style={{ borderTop: '1px solid rgba(232,229,224,0.5)' }}>
              <button disabled={!data.has_prev} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40"
                style={{ border: '1px solid #e8e5e0', color: '#888' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#f7f5f2' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >{t('prev')}</button>
              <span className="px-3 py-1.5 text-xs" style={{ color: '#888' }}>{data.page} / {data.pages}</span>
              <button disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40"
                style={{ border: '1px solid #e8e5e0', color: '#888' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#f7f5f2' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >{t('next')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
