import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProduct } from '../api/products'
import { addToCart } from '../api/cart'
import { useAuthStore } from '../store/auth'
import { useLang } from '../store/lang'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [added, setAdded] = useState(false)
  const { t } = useLang()

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(Number(id), true),
    enabled: !!id,
  })

  const addMutation = useMutation({
    mutationFn: () => addToCart(product!.id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    },
  })

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    addMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl sm:rounded-3xl shimmer" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3].map(i => <div key={i} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shimmer flex-shrink-0" />)}
          </div>
        </div>
        <div className="space-y-5 pt-0 md:pt-2">
          <div className="h-7 rounded-xl shimmer w-4/5" />
          <div className="flex gap-2">
            <div className="h-7 rounded-full shimmer w-20" />
            <div className="h-7 rounded-full shimmer w-24" />
          </div>
          <div className="h-12 rounded-2xl shimmer w-2/5 mt-4" />
          <div className="h-14 rounded-2xl shimmer mt-8" />
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="text-center py-20 sm:py-24 max-w-sm mx-auto px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6" style={{ background: '#fef2f2' }}>
          <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#fca5a5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-bold text-lg mb-2" style={{ color: '#1a2f4e' }}>{t('notFound')}</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all mt-4"
          style={{ background: '#1a2f4e' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('back')}
        </Link>
      </div>
    )
  }

  const allImages = product.images && product.images.length > 0
    ? product.images.map((img) => img.image_path)
    : product.image ? [product.image] : []

  const currentImage = allImages[selectedImage] ?? null

  const stockLevel = product.quantity <= 0
    ? 'out'
    : product.quantity <= 5
    ? 'low'
    : 'ok'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-5 sm:mb-8" aria-label="Breadcrumb">
        <Link to="/" className="transition-colors flex-shrink-0" style={{ color: '#888' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1a2f4e')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}
        >
          {t('shop') ?? 'Shop'}
        </Link>
        <svg className="w-3 h-3 flex-shrink-0" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="truncate font-medium" style={{ color: '#1a2f4e' }}>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
        {/* Images column */}
        <div className="space-y-3">
          {/* Main image — full width, square */}
          <div
            className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden relative group"
            style={{ background: 'linear-gradient(145deg, #f0ede8, #ede9e3)' }}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <svg className="w-14 h-14 sm:w-16 sm:h-16" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs" style={{ color: '#ccc' }}>No image</span>
              </div>
            )}

            {/* Out of stock overlay */}
            {!product.is_available && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(4px)' }}>
                <span className="text-sm font-bold px-4 py-2 rounded-full bg-white" style={{ color: '#888', border: '1.5px solid #e8e5e0', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                  {t('outOfStock')}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails — horizontal scroll */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {allImages.map((img, i) => (
                <button
                  key={i}
                  aria-label={`View image ${i + 1} of ${allImages.length}`}
                  aria-pressed={i === selectedImage}
                  onClick={() => setSelectedImage(i)}
                  className="flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden transition-all"
                  style={{
                    width: 60,
                    height: 60,
                    border: `2.5px solid ${i === selectedImage ? '#ff4d1c' : 'transparent'}`,
                    outline: i === selectedImage ? '2px solid rgba(255,77,28,0.15)' : 'none',
                    opacity: i === selectedImage ? 1 : 0.55,
                  }}
                  onMouseEnter={e => { if (i !== selectedImage) e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { if (i !== selectedImage) e.currentTarget.style.opacity = '0.55' }}
                >
                  <img src={img} alt={`${product.name} – ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex flex-col">
          <div className="flex-1">
            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3 sm:mb-4" style={{ color: '#1a2f4e', letterSpacing: '-0.01em' }}>
              {product.name}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-5 sm:mb-8">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#f0ede8', color: '#555' }}>
                {t('size')} {product.size}
              </span>
              {stockLevel === 'out' && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {t('outOfStock')}
                </span>
              )}
              {stockLevel === 'low' && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#fff7ed', color: '#c2410c' }}>
                  {product.quantity} {t('inStock')} — {t('left')}
                </span>
              )}
              {stockLevel === 'ok' && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#f0fdf4', color: '#166534' }}>
                  {product.quantity} {t('inStock')}
                </span>
              )}
            </div>

            {/* Price */}
            <div
              className="flex items-baseline gap-2 pb-5 sm:pb-8 mb-5 sm:mb-8"
              style={{ borderBottom: '1px solid #e8e5e0' }}
            >
              <span className="font-black" style={{ fontSize: 'clamp(2rem, 8vw, 2.5rem)', color: '#1a2f4e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {product.price.toLocaleString()}
              </span>
              <span className="text-base sm:text-lg font-semibold" style={{ color: '#bbb' }}>UZS</span>
            </div>

            {/* Quantity selector */}
            {product.is_available && (
              <div className="flex items-center gap-4 sm:gap-5 mb-5 sm:mb-8">
                <span className="text-sm font-semibold flex-shrink-0" style={{ color: '#888' }}>{t('quantity')}</span>
                <div className="flex items-center gap-1 rounded-2xl p-1" style={{ background: '#f0ede8' }}>
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="flex items-center justify-center rounded-xl font-bold text-lg transition-all disabled:opacity-30"
                    style={{ color: '#1a2f4e', width: 44, height: 44 }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(0,0,0,0.07)' }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    −
                  </button>
                  <span className="text-center text-sm font-black" style={{ color: '#1a2f4e', width: 36 }} aria-label={`Quantity: ${qty}`}>
                    {qty}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQty(q => Math.min(product.quantity, q + 1))}
                    disabled={qty >= product.quantity}
                    className="flex items-center justify-center rounded-xl font-bold text-lg transition-all disabled:opacity-30"
                    style={{ color: '#1a2f4e', width: 44, height: 44 }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(0,0,0,0.07)' }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    +
                  </button>
                </div>
                <span className="text-xs" style={{ color: '#bbb' }}>
                  max {product.quantity}
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.is_available || addMutation.isPending}
              className="w-full rounded-2xl font-bold text-sm tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: added
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #1a2f4e, #243c61)',
                color: '#fff',
                boxShadow: added
                  ? '0 6px 20px rgba(34,197,94,0.3)'
                  : '0 6px 20px rgba(26,47,78,0.25)',
                height: 52,
              }}
              onMouseEnter={e => {
                if (!e.currentTarget.disabled && !added) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,77,28,0.4)'
                }
              }}
              onMouseLeave={e => {
                if (!added) {
                  e.currentTarget.style.background = product.is_available
                    ? 'linear-gradient(135deg, #1a2f4e, #243c61)'
                    : 'linear-gradient(135deg, #888, #999)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,47,78,0.25)'
                }
              }}
            >
              {added ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('added')}
                </>
              ) : addMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                  </svg>
                  {t('adding')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('addToCart')}
                </>
              )}
            </button>

            {!isAuthenticated && (
              <p className="text-center text-xs" style={{ color: '#aaa' }}>
                {t('loginToAdd')}{' '}
                <Link to="/login" className="font-semibold underline transition-colors" style={{ color: '#1a2f4e' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#1a2f4e')}
                >
                  {t('loginLink')}
                </Link>
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
