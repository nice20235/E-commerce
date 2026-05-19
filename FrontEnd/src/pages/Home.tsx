import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import { useLang } from '../store/lang'
import type { SortOption } from '../types'

const LIMIT = 20

export default function Home() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<SortOption>('id_desc')
  const { t, lang } = useLang()

  const SORT_OPTIONS = useMemo<{ value: SortOption; label: string }[]>(() => [
    { value: 'id_desc', label: lang === 'uz' ? 'Yangi' : 'Новые' },
    { value: 'price_asc', label: lang === 'uz' ? 'Arzon' : 'Дешевле' },
    { value: 'price_desc', label: lang === 'uz' ? 'Qimmat' : 'Дороже' },
    { value: 'name_asc', label: 'A–Z' },
  ], [lang])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, search, sort],
    queryFn: () => getProducts({ skip: (page - 1) * LIMIT, limit: LIMIT, sort, search: search || undefined }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }, [searchInput])

  const handleSort = useCallback((value: SortOption) => {
    setSort(value)
    setPage(1)
  }, [])

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-8 sm:mb-12 px-4 py-10 sm:px-16 sm:py-24"
        style={{ background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 55%, #1a2d50 100%)' }}
      >
        {/* Glow orbs — contain on their own layer to avoid triggering layout on paint */}
        <div aria-hidden="true" style={{ background: 'rgba(255,77,28,0.22)', width: '60%', paddingTop: '60%', borderRadius: '50%', position: 'absolute', top: '-25%', right: '-15%', filter: 'blur(90px)', pointerEvents: 'none', willChange: 'transform' }} />
        <div aria-hidden="true" style={{ background: 'rgba(255,77,28,0.10)', width: '40%', paddingTop: '40%', borderRadius: '50%', position: 'absolute', bottom: '-20%', left: '-10%', filter: 'blur(70px)', pointerEvents: 'none', willChange: 'transform' }} />
        <div aria-hidden="true" style={{ background: 'rgba(100,150,255,0.08)', width: '35%', paddingTop: '35%', borderRadius: '50%', position: 'absolute', top: '30%', left: '40%', filter: 'blur(80px)', pointerEvents: 'none', willChange: 'transform' }} />

        {/* Grid texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <div className="relative z-10 max-w-xl">
          <span
            className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-4 sm:mb-6 px-3 py-1.5 rounded-full"
            style={{ color: '#ff7a50', background: 'rgba(255,77,28,0.12)', border: '1px solid rgba(255,77,28,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff4d1c' }} />
            {t('newCollection')}
          </span>

          <h1
            className="font-black leading-[1.05] tracking-tight mb-4 sm:mb-5"
            style={{ fontSize: 'clamp(2rem, 7vw, 4.8rem)', color: '#fff', letterSpacing: '-0.02em' }}
          >
            {t('heroTitle')}<br />
            <span style={{ background: 'linear-gradient(90deg, #ff4d1c, #ff8c6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('heroAccent')}
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg max-w-sm leading-relaxed mb-6 sm:mb-10" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('heroSub')}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['#ff9a7c', '#ffb347', '#7ec8e3'].map((c, i) => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2" style={{ background: c, borderColor: '#0f1e33' }} />
                ))}
              </div>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
                <span className="font-bold" style={{ color: '#fff' }}>{data?.total ?? '—'}</span>{' '}
                {t('stylesAvailable')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#bbb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 rounded-xl transition-all"
              style={{
                background: '#fff',
                border: '1.5px solid #e8e5e0',
                color: '#1a2f4e',
                outline: 'none',
                height: 44,
                fontSize: 16,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')}
            />
          </div>
          <button
            type="submit"
            className="px-4 sm:px-5 rounded-xl text-sm font-semibold text-white transition-all flex-shrink-0"
            style={{ background: '#1a2f4e', height: 44 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
          >
            {t('search')}
          </button>
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
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

        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={e => handleSort(e.target.value as SortOption)}
            className="appearance-none pl-4 pr-9 rounded-xl font-medium transition-all cursor-pointer w-full sm:w-auto"
            style={{
              background: '#fff',
              border: '1.5px solid #e8e5e0',
              color: '#1a2f4e',
              outline: 'none',
              height: 44,
              fontSize: 16,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#1a2f4e')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e8e5e0')}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#888' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
        <h2 className="text-lg sm:text-xl font-black truncate" style={{ color: '#1a2f4e' }}>
          {search
            ? `${t('searchResult')}: "${search}"`
            : t('allSlippers')}
        </h2>
        {data && (
          <p className="text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 rounded-full flex-shrink-0" style={{ color: '#888', background: '#fff', border: '1px solid #e8e5e0' }}>
            {data.total} {t('products')}
          </p>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="shimmer" style={{ aspectRatio: '1/1' }} />
              <div className="p-3 sm:p-4 space-y-2.5">
                <div className="shimmer rounded-lg h-3 w-4/5" />
                <div className="shimmer rounded-lg h-3 w-2/5" />
                <div className="flex justify-between items-center mt-3">
                  <div className="shimmer rounded-lg h-4 w-1/3" />
                  <div className="shimmer rounded-full h-5 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-16 sm:py-20 rounded-2xl sm:rounded-3xl" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fef2f2' }}>
            <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-bold mb-1" style={{ color: '#1a2f4e' }}>{t('loadError')}</p>
          <p className="text-sm" style={{ color: '#888' }}>{t('loadErrorSub')}</p>
        </div>
      )}

      {/* Empty */}
      {data && data.items.length === 0 && (
        <div className="text-center py-20 sm:py-24 rounded-2xl sm:rounded-3xl" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5" style={{ background: '#f0ede8' }}>
            <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="font-bold text-base sm:text-lg mb-1" style={{ color: '#1a2f4e' }}>{t('noProducts')}</p>
          <p className="text-sm" style={{ color: '#888' }}>{t('noProductsSub')}</p>
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="mt-5 sm:mt-6 px-5 py-2.5 rounded-full text-sm font-semibold transition-all text-white"
              style={{ background: '#1a2f4e' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
            >
              {t('showAllProducts')}
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 fade-up">
          {data.items.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 mt-10 sm:mt-14">
          <button
            disabled={!data.has_prev}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 rounded-full text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: '1.5px solid #e8e5e0', background: '#fff', color: '#1a2f4e', height: 44 }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a2f4e' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a2f4e'; e.currentTarget.style.borderColor = '#e8e5e0' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{t('prev')}</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => {
              const isPageActive = p === data.page
              if (data.pages > 7 && Math.abs(p - data.page) > 2 && p !== 1 && p !== data.pages) {
                if (p === data.page - 3 || p === data.page + 3) return <span key={p} className="text-sm px-1" style={{ color: '#ccc' }}>…</span>
                return null
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: isPageActive ? '#1a2f4e' : '#fff',
                    color: isPageActive ? '#fff' : '#888',
                    border: `1.5px solid ${isPageActive ? '#1a2f4e' : '#e8e5e0'}`,
                    width: 44,
                    height: 44,
                  }}
                  onMouseEnter={e => { if (!isPageActive) { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' } }}
                  onMouseLeave={e => { if (!isPageActive) { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' } }}
                >
                  {p}
                </button>
              )
            })}
          </div>

          <button
            disabled={!data.has_next}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 rounded-full text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: '1.5px solid #e8e5e0', background: '#fff', color: '#1a2f4e', height: 44 }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a2f4e' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a2f4e'; e.currentTarget.style.borderColor = '#e8e5e0' }}
          >
            <span className="hidden sm:inline">{t('next')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
