import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart, updateCartItem, removeCartItem, clearCart } from '../api/cart'
import { useLang } from '../store/lang'

export default function Cart() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLang()

  const { data, isLoading, isError } = useQuery({ queryKey: ['cart'], queryFn: getCart })

  const updateMutation = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => updateCartItem(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
  const removeMutation = useMutation({
    mutationFn: (id: number) => removeCartItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  const cart = data?.data

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 mt-4">
        {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl h-24 shimmer" style={{ background: '#fff' }} />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <p className="font-semibold mb-2" style={{ color: '#1a2f4e' }}>{t('loadError')}</p>
        <p className="text-sm" style={{ color: '#888' }}>{t('loadErrorSub')}</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>
          🛒
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#1a2f4e' }}>{t('cartEmpty')}</h2>
        <p className="text-sm mb-8" style={{ color: '#888' }}>{t('cartEmptySub')}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all"
          style={{ background: '#1a2f4e' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
        >
          {t('browseShop')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black" style={{ color: '#1a2f4e' }}>{t('cart')}
          <span className="ml-2 text-base font-medium" style={{ color: '#888' }}>({cart.items_count} {t('items')})</span>
        </h1>
        <button
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
          className="text-xs font-medium transition-colors"
          style={{ color: '#888' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}
        >
          {t('clearAll')}
        </button>
      </div>

      <div className="space-y-3 mb-8">
        {cart.items.map((item) => {
          const isPending = updateMutation.isPending || removeMutation.isPending
          return (
            <div key={item.cart_item_id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: '#f0ede8' }}>
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🥿</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: '#1a2f4e' }}>{item.name}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: '#ff4d1c' }}>{item.price.toLocaleString()} UZS</p>
              </div>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: '#f0ede8' }}>
                <button
                  aria-label="Decrease quantity"
                  disabled={isPending || item.quantity <= 1}
                  onClick={() => {
                    if (item.quantity <= 1) {
                      removeMutation.mutate(item.cart_item_id)
                    } else {
                      updateMutation.mutate({ id: item.cart_item_id, qty: item.quantity - 1 })
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center font-bold text-sm transition-colors disabled:opacity-40"
                  style={{ color: '#1a2f4e' }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-bold" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                <button
                  aria-label="Increase quantity"
                  disabled={isPending}
                  onClick={() => updateMutation.mutate({ id: item.cart_item_id, qty: item.quantity + 1 })}
                  className="w-8 h-8 flex items-center justify-center font-bold text-sm transition-colors disabled:opacity-40"
                  style={{ color: '#1a2f4e' }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  +
                </button>
              </div>
              <p className="text-sm font-bold w-24 text-right" style={{ color: '#1a2f4e' }}>
                {item.subtotal.toLocaleString()}
              </p>
              <button
                aria-label={`Remove ${item.name} from cart`}
                disabled={isPending}
                onClick={() => removeMutation.mutate(item.cart_item_id)}
                className="transition-colors disabled:opacity-40"
                style={{ color: '#aaa' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.color = '#ff4d1c' }}
                onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="rounded-3xl p-6 text-white" style={{ background: '#1a2f4e' }}>
        <div className="flex justify-between text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span>{t('subtotal')}</span>
          <span>{cart.total_amount.toLocaleString()} {cart.currency}</span>
        </div>
        <div className="flex justify-between items-end mb-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
          <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('total')}</span>
          <div className="text-right">
            <p className="text-2xl font-black">{cart.total_amount.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{cart.currency}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full text-white py-3.5 rounded-2xl font-bold text-sm transition-all"
          style={{ background: '#ff4d1c' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e03c10')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ff4d1c')}
        >
          {t('checkout')} →
        </button>
        <Link to="/" className="block text-center mt-3 text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          {t('continueShopping')}
        </Link>
      </div>
    </div>
  )
}
