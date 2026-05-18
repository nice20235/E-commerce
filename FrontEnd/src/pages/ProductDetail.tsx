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
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-3xl shimmer" style={{ background: '#fff' }} />
        <div className="space-y-5 pt-4">
          <div className="h-7 rounded-xl shimmer w-3/4" />
          <div className="h-5 rounded-xl shimmer w-1/4" />
          <div className="h-10 rounded-xl shimmer w-2/5 mt-4" />
          <div className="h-12 rounded-2xl shimmer mt-8" />
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="text-center py-24">
        <p className="text-5xl mb-4">🥿</p>
        <p className="font-semibold text-lg" style={{ color: '#1a2f4e' }}>{t('notFound')}</p>
        <Link to="/" className="mt-4 inline-block text-sm underline" style={{ color: '#ff4d1c' }}>{t('back')}</Link>
      </div>
    )
  }

  const allImages = product.images && product.images.length > 0
    ? product.images.map((img) => img.image_path)
    : product.image ? [product.image] : []

  const currentImage = allImages[selectedImage] ?? null

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors"
        style={{ color: '#888' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#1a2f4e')}
        onMouseLeave={e => (e.currentTarget.style.color = '#888')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-3xl overflow-hidden" style={{ background: '#f0ede8' }}>
            {currentImage ? (
              <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl" style={{ opacity: 0.3 }}>🥿</div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  aria-label={`View image ${i + 1} of ${allImages.length}`}
                  aria-pressed={i === selectedImage}
                  onClick={() => setSelectedImage(i)}
                  className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden transition-all"
                  style={{
                    border: `2px solid ${i === selectedImage ? '#1a2f4e' : 'transparent'}`,
                    opacity: i === selectedImage ? 1 : 0.6,
                    transform: i === selectedImage ? 'scale(0.95)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { if (i !== selectedImage) e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { if (i !== selectedImage) e.currentTarget.style.opacity = '0.6' }}
                >
                  <img src={img} alt={`${product.name} – image ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex-1">
            <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: '#1a2f4e' }}>{product.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(10,10,15,0.06)', color: 'rgba(10,10,15,0.7)' }}>
                {t('size')} {product.size}
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{
                background: product.is_available ? '#f0fdf4' : '#fef2f2',
                color: product.is_available ? '#166534' : '#dc2626',
              }}>
                {product.is_available ? `${product.quantity} ${t('inStock')}` : t('outOfStock')}
              </span>
            </div>

            <div className="pt-6 mb-8" style={{ borderTop: '1px solid #e8e5e0' }}>
              <p className="text-4xl font-black" style={{ color: '#1a2f4e' }}>
                {product.price.toLocaleString()}
                <span className="text-lg font-medium ml-2" style={{ color: '#888' }}>UZS</span>
              </p>
            </div>

            {product.is_available && (
              <div className="flex items-center gap-4 mb-8">
                <span className="text-sm font-medium" style={{ color: '#888' }}>{t('quantity')}</span>
                <div className="flex items-center rounded-2xl overflow-hidden" style={{ background: '#f0ede8' }}>
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center font-bold transition-colors"
                    style={{ color: '#1a2f4e' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold" aria-label={`Quantity: ${qty}`}>{qty}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => Math.min(product.quantity, q + 1))}
                    className="w-10 h-10 flex items-center justify-center font-bold transition-colors"
                    style={{ color: '#1a2f4e' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.is_available || addMutation.isPending}
              className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: added ? '#22c55e' : '#1a2f4e', color: '#fff' }}
              onMouseEnter={e => { if (!e.currentTarget.disabled && !added) e.currentTarget.style.background = '#ff4d1c' }}
              onMouseLeave={e => { if (!added) e.currentTarget.style.background = product.is_available ? '#1a2f4e' : '#888' }}
            >
              {added ? `✓ ${t('added')}` : addMutation.isPending ? t('adding') : t('addToCart')}
            </button>

            {!isAuthenticated && (
              <p className="text-center text-xs" style={{ color: '#888' }}>
                {t('loginToAdd')}{' '}
                <Link to="/login" className="font-medium" style={{ color: '#ff4d1c' }}>{t('loginLink')}</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
