import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import { useLang } from '../store/lang'
import type { SortOption } from '../types'

const LIMIT = 20

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'id_desc', labelKey: 'Yangi' },
  { value: 'price_asc', labelKey: 'Arzon' },
  { value: 'price_desc', labelKey: 'Qimmat' },
  { value: 'name_asc', labelKey: 'A–Z' },
]

export default function Home() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<SortOption>('id_desc')
  const { t } = useLang()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, search, sort],
    queryFn: () => getProducts({ skip: (page - 1) * LIMIT, limit: LIMIT, sort, search: search || undefined }),
    staleTime: 60_000,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleSort = (value: SortOption) => {
    setSort(value)
    setPage(1)
  }

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl mb-12 px-8 py-16 sm:px-14 sm:py-24"
        style={{ background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 55%, #1a2d50 100%)' }}
      >
        {/* Glow orbs */}
        <div style={{ background: 'rgba(255,77,28,0.22)', width: 500, height: 500, borderRadius: '50%', position: 'absolute', top: -150, right: -120, filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ background: 'rgba(255,77,28,0.10)', width: 350, height: 350, borderRadius: '50%', position: 'absolute', bottom: -100, left: -80, filter: 'blur(70px)', pointerEvents: 'none' }} />
        <div style={{ background: 'rgba(100,150,255,0.08)', width: 300, height: 300, borderRadius: '50%', position: 'absolute', top: '30%', left: '40%', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div className="relative z-10 max-w-xl">
          <span
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-6 px-3 py-1.5 rounded-full"
            style={{ color: '#ff7a50', background: 'rgba(255,77,28,0.12)', border: '1px solid rgba(255,77,28,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff4d1c' }} />
            {t('newCollection')}
          </span>
          <h1
            className="font-black leading-[1.05] tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', color: '#fff', letterSpacing: '-0.02em' }}
          >
            {t('heroTitle')}<br />
            <span style={{ background: 'linear-gradient(90deg, #ff4d1c, #ff8c6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('heroAccent')}
            </span>
          </h1>
          <p className="text-base sm:text-lg max-w-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('heroSub')}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['#ff9a7c', '#ffb347', '#7ec8e3'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2" style={{ background: c, borderColor: '#0f1e33' }} />
                ))}
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
                <span className="font-bold" style={{ color: '#fff' }}>{data?.total ?? '—'}</span> {t('stylesAvailable')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
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
            {t('search')}
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{ border: '1.5px solid #e8e5e0', color: '#888' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' }}
            >
              ✕
            </button>
          )}
        </form>

        <select
          value={sort}
          onChange={e => handleSort(e.target.value as SortOption)}
          className="px-3 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: '#fff', border: '1.5px solid #e8e5e0', color: '#1a2f4e', outline: 'none', cursor: 'pointer' }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.labelKey}</option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black" style={{ color: '#1a2f4e' }}>{t('allSlippers')}</h2>
        {data && <p className="text-sm" style={{ color: '#888' }}>{data.total} {t('products')}</p>}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="shimmer" style={{ aspectRatio: '1/1' }} />
              <div className="p-4 space-y-2">
                <div className="shimmer rounded-lg h-3 w-4/5" />
                <div className="shimmer rounded-lg h-3 w-2/5" />
                <div className="shimmer rounded-lg h-4 w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-semibold" style={{ color: '#1a2f4e' }}>{t('loadError')}</p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{t('loadErrorSub')}</p>
        </div>
      )}

      {/* Empty */}
      {data && data.items.length === 0 && (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🥿</p>
          <p className="font-semibold text-lg" style={{ color: '#1a2f4e' }}>{t('noProducts')}</p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{t('noProductsSub')}</p>
        </div>
      )}

      {/* Grid */}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.items.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-12">
          <button
            disabled={!data.has_prev}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: '1px solid #e8e5e0', background: '#fff', color: '#1a2f4e' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a2f4e' }}
          >
            ← {t('prev')}
          </button>
          <span className="text-sm px-2" style={{ color: '#888' }}>{t('pageOf')} {data.page} / {data.pages}</span>
          <button
            disabled={!data.has_next}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: '1px solid #e8e5e0', background: '#fff', color: '#1a2f4e' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a2f4e' }}
          >
            {t('next')} →
          </button>
        </div>
      )}
    </div>
  )
}
