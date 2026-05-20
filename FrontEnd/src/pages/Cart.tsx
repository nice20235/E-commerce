import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart, updateCartItem, removeCartItem, clearCart } from '../api/cart'
import { useLang } from '../store/lang'
import { getImageUrl } from '../utils/image'

export default function Cart() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLang()

  const { data, isLoading, isError } = useQuery({ queryKey: ['cart'], queryFn: getCart, staleTime: 30_000 })

  const updateMutation = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => updateCartItem(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
  const removeMutation = useMutation({
    mutationFn: (id: number) => removeCartItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  const cart = data?.data

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 rounded-xl shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 rounded-lg shimmer w-3/4" />
                <div className="h-3 rounded-lg shimmer w-1/4" />
              </div>
              <div className="w-24 h-9 rounded-xl shimmer" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fef2f2' }}>
          <svg className="w-8 h-8" style={{ color: '#fca5a5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-bold mb-1" style={{ color: '#1a2f4e' }}>{t('loadError')}</p>
        <p className="text-sm" style={{ color: '#888' }}>{t('loadErrorSub')}</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 sm:py-24 px-4">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6"
          style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}
        >
          <svg className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: '#d0cdc9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-2" style={{ color: '#1a2f4e' }}>{t('cartEmpty')}</h2>
        <p className="text-sm mb-7 sm:mb-8 max-w-xs mx-auto" style={{ color: '#888' }}>{t('cartEmptySub')}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white px-6 py-3.5 rounded-full font-bold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #1a2f4e, #243c61)', boxShadow: '0 4px 16px rgba(26,47,78,0.25)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,77,28,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1a2f4e, #243c61)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,47,78,0.25)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('browseShop')}
        </Link>
      </div>
    )
  }

  const unavailable = cart?.unavailable_items ?? []

  return (
    <div className="max-w-2xl mx-auto">
      {/* Unavailable items warning */}
      {unavailable.length > 0 && (
        <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ea580c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#9a3412' }}>
              {unavailable.length === 1 ? '1 item is no longer available' : `${unavailable.length} items are no longer available`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#c2410c' }}>
              {unavailable.map(i => i.name).join(', ')} — removed from your cart
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black" style={{ color: '#1a2f4e' }}>{t('cart')}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#888' }}>
            {cart.items_count} {t('items')}
          </p>
        </div>
        <button
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all disabled:opacity-40"
          style={{ color: '#888', border: '1px solid #e8e5e0', background: '#fff', minHeight: 36 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e8e5e0' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {t('clearAll')}
        </button>
      </div>

      {/* Items — card layout (works on all screen sizes) */}
      <div className="space-y-3 mb-6 sm:mb-8">
        {cart.items.map((item) => {
          const isPending = updateMutation.isPending || removeMutation.isPending
          return (
            <div
              key={item.cart_item_id}
              className="rounded-2xl p-3 sm:p-4 transition-all"
              style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              {/* Top row: image + name + remove */}
              <div className="flex items-start gap-3">
                {/* Image */}
                <Link to={`/products/${item.product_id}`} className="flex-shrink-0 rounded-xl overflow-hidden block" style={{ background: '#f0ede8', width: 64, height: 64 }}>
                  {item.image
                    ? <img src={getImageUrl(item.image)} alt={item.name} loading="lazy" decoding="async" width={64} height={64} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-7 h-7" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )
                  }
                </Link>

                {/* Name + price */}
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product_id}`} className="font-semibold text-sm transition-colors block truncate"
                    style={{ color: '#1a2f4e' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#1a2f4e')}
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#ff4d1c' }}>
                    {item.price.toLocaleString()} <span style={{ color: '#ccc', fontWeight: 400 }}>UZS</span>
                  </p>
                </div>

                {/* Remove */}
                <button
                  aria-label={`Remove ${item.name} from cart`}
                  disabled={isPending}
                  onClick={() => removeMutation.mutate(item.cart_item_id)}
                  className="flex items-center justify-center rounded-full transition-all disabled:opacity-40 flex-shrink-0"
                  style={{ color: '#ccc', background: 'transparent', width: 36, height: 36 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Bottom row: qty controls + subtotal */}
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #f0ede8' }}>
                {/* Quantity control — large touch targets */}
                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: '#f0ede8' }}>
                  <button
                    aria-label="Decrease quantity"
                    disabled={isPending}
                    onClick={() => {
                      if (item.quantity <= 1) {
                        removeMutation.mutate(item.cart_item_id)
                      } else {
                        updateMutation.mutate({ id: item.cart_item_id, qty: item.quantity - 1 })
                      }
                    }}
                    className="flex items-center justify-center rounded-lg font-bold text-base transition-colors disabled:opacity-40"
                    style={{ color: '#1a2f4e', width: 44, height: 44 }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(0,0,0,0.07)' }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    −
                  </button>
                  <span className="text-center text-sm font-black" style={{ color: '#1a2f4e', width: 32 }} aria-label={`Quantity: ${item.quantity}`}>
                    {item.quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    disabled={isPending}
                    onClick={() => updateMutation.mutate({ id: item.cart_item_id, qty: item.quantity + 1 })}
                    className="flex items-center justify-center rounded-lg font-bold text-base transition-colors disabled:opacity-40"
                    style={{ color: '#1a2f4e', width: 44, height: 44 }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(0,0,0,0.07)' }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: '#1a2f4e' }}>{item.subtotal.toLocaleString()}</p>
                  <p className="text-[10px]" style={{ color: '#ccc' }}>UZS</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order summary */}
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(26,47,78,0.2)' }}>
        <div className="p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)' }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 sm:mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {t('orderSummary') ?? 'Order Summary'}
          </h2>

          <div className="space-y-2 mb-4 sm:mb-5 pb-4 sm:pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {cart.items.map(item => (
              <div key={item.cart_item_id} className="flex justify-between text-xs gap-3">
                <span className="truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.name} × {item.quantity}</span>
                <span className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-5 sm:mb-6">
            <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('total')}</span>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-black text-white">{cart.total_amount.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{cart.currency}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #ff4d1c, #ff6a3c)',
              boxShadow: '0 4px 16px rgba(255,77,28,0.4)',
              height: 52,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #e03c10, #ff4d1c)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,77,28,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,77,28,0.4)' }}
          >
            {t('checkout')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <Link
            to="/"
            className="block text-center mt-3 text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.28)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
          >
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}
