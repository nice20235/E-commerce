import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addToCart } from '../api/cart'
import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../types'
import { useLang } from '../store/lang'
import { getImageUrl } from '../utils/image'

export default function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLang()

  const addMutation = useMutation({
    mutationFn: () => addToCart(product.id, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) { navigate('/login'); return }
    if (!product.is_available) return
    addMutation.mutate()
  }

  const stockLow = product.quantity > 0 && product.quantity <= 5

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card flex flex-col rounded-2xl overflow-hidden group"
      style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Image area */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #f0ede8, #ede9e3)',
          aspectRatio: '1/1',
        }}
      >
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            loading="lazy"
            className="card-img w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: '#d0cdc9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Out-of-stock overlay */}
        {!product.is_available && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(3px)' }}
          >
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-white"
              style={{ color: '#888', border: '1px solid #e8e5e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {t('outOfStock')}
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {stockLow && product.is_available && (
          <div className="absolute top-2 left-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
            >
              {product.quantity} {t('left')}
            </span>
          </div>
        )}

        {/* Add-to-cart: hover overlay on desktop, always visible button on mobile */}
        {product.is_available && (
          <>
            {/* Desktop: slide-up on hover */}
            <div className="card-overlay hidden sm:block absolute bottom-0 inset-x-0 p-3">
              <button
                onClick={handleAdd}
                disabled={addMutation.isPending}
                className="w-full text-white text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{
                  background: addMutation.isSuccess
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, #ff4d1c, #ff6a3c)',
                  boxShadow: addMutation.isSuccess
                    ? '0 4px 14px rgba(34,197,94,0.45)'
                    : '0 4px 14px rgba(255,77,28,0.45)',
                }}
              >
                {addMutation.isPending ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                    </svg>
                    {t('adding')}
                  </>
                ) : addMutation.isSuccess ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('added')}
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {t('addToCart')}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Product info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3
          className="font-semibold text-xs sm:text-sm line-clamp-2 mb-1 transition-colors"
          style={{ color: '#1a2f4e', lineHeight: 1.4 }}
        >
          {product.name}
        </h3>

        <p className="text-[11px] sm:text-xs mb-2 sm:mb-3" style={{ color: '#bbb' }}>
          {t('size')} {product.size}
        </p>

        <div className="mt-auto flex items-end justify-between gap-1">
          <div className="leading-none min-w-0">
            <span className="font-extrabold text-sm sm:text-base" style={{ color: '#1a2f4e' }}>
              {product.price.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-[11px] ml-1" style={{ color: '#ccc' }}>UZS</span>
          </div>

          {product.quantity > 5 && (
            <span className="text-[10px] sm:text-[11px] flex-shrink-0" style={{ color: '#ccc' }}>
              {product.quantity} {t('left')}
            </span>
          )}
        </div>

        {/* Mobile-only add to cart button — always visible at bottom of card */}
        {product.is_available && (
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            aria-label={`${t('addToCart')}: ${product.name}`}
            className="sm:hidden w-full mt-2.5 text-white text-[11px] font-bold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
            style={{
              background: addMutation.isSuccess
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #ff4d1c, #ff6a3c)',
              boxShadow: addMutation.isSuccess
                ? '0 2px 8px rgba(34,197,94,0.3)'
                : '0 2px 8px rgba(255,77,28,0.3)',
              minHeight: 44,
            }}
          >
            {addMutation.isPending ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                </svg>
                {t('adding')}
              </>
            ) : addMutation.isSuccess ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {t('added')}
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('addToCart')}
              </>
            )}
          </button>
        )}
      </div>
    </Link>
  )
}
