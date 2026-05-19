import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart } from '../api/cart'
import { createOrderFromCart, initPayment } from '../api/orders'
import { useState } from 'react'
import type { Order } from '../types'
import { useLang } from '../store/lang'
import { getImageUrl } from '../utils/image'
import { extractApiError } from '../api/errors'

export default function Checkout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const { t } = useLang()

  const { data, isLoading } = useQuery({ queryKey: ['cart'], queryFn: getCart })

  const orderMutation = useMutation({
    mutationFn: () => {
      if (!data?.data) throw new Error('Cart data unavailable')
      return createOrderFromCart(data.data.id, data.data.total_amount)
    },
    onSuccess: (order) => {
      setCreatedOrder(order)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: unknown) => {
      setError(extractApiError(err, 'Failed to create order.'))
    },
  })

  const cart = data?.data

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-0">
        <div className="h-8 shimmer rounded-xl w-40 mb-8" />
        <div className="rounded-3xl p-5 sm:p-6 mb-4" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-3 shimmer rounded w-2/5" />
                <div className="h-3 shimmer rounded w-1/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f0ede8' }}>
          <svg className="w-8 h-8" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="font-bold mb-4" style={{ color: '#1a2f4e' }}>{t('cartEmpty')}</p>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-semibold transition-colors"
          style={{ color: '#ff4d1c' }}
        >
          {t('browseShop')}
        </button>
      </div>
    )
  }

  /* ── Order placed success screen ── */
  if (createdOrder) {
    const orderId = Number(createdOrder.order_id.replace('order_', ''))
    return (
      <div className="max-w-md mx-auto text-center py-8 sm:py-12 px-0">
        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          {/* Success icon */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#22c55e' }} />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
              <svg className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mb-1" style={{ color: '#1a2f4e' }}>{t('orderPlaced')}</h2>
          <p className="text-sm font-mono mb-2" style={{ color: '#bbb' }}>{createdOrder.order_id}</p>

          <div className="my-5 sm:my-6 py-4 rounded-2xl" style={{ background: '#faf9f7', border: '1px solid #e8e5e0' }}>
            <p className="text-2xl sm:text-3xl font-black" style={{ color: '#1a2f4e', letterSpacing: '-0.02em' }}>
              {(createdOrder.total_amount / 100).toLocaleString()}
            </p>
            <p className="text-sm mt-1" style={{ color: '#bbb' }}>UZS</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => initPayment(orderId, createdOrder.total_amount)}
              className="w-full text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ff4d1c, #ff6a3c)',
                boxShadow: '0 4px 16px rgba(255,77,28,0.4)',
                height: 52,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #e03c10, #ff4d1c)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,77,28,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,77,28,0.4)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {t('payNowBank')}
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="w-full rounded-2xl font-semibold text-sm transition-all"
              style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', height: 48 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' }}
            >
              {t('viewMyOrders')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Checkout form ── */
  return (
    <div className="max-w-md mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/cart')}
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 sm:mb-8 transition-colors"
        style={{ color: '#888', minHeight: 44 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#1a2f4e')}
        onMouseLeave={e => (e.currentTarget.style.color = '#888')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('backToCart')}
      </button>

      <h1 className="text-xl sm:text-2xl font-black mb-5 sm:mb-8" style={{ color: '#1a2f4e' }}>{t('checkoutTitle')}</h1>

      {/* Order summary card */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4 sm:mb-5" style={{ color: 'rgba(10,10,15,0.3)' }}>
          {t('orderSummary')}
        </h2>

        <div className="space-y-3 mb-4 sm:mb-5">
          {cart.items.map((item) => (
            <div key={item.cart_item_id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#f0ede8' }}>
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-4 h-4" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-sm truncate" style={{ color: '#555' }}>{item.name} × {item.quantity}</span>
              </div>
              <span className="font-semibold text-sm flex-shrink-0" style={{ color: '#1a2f4e' }}>{item.subtotal.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid #e8e5e0' }}>
          <span className="font-bold text-sm" style={{ color: '#1a2f4e' }}>{t('total')}</span>
          <div className="text-right">
            <span className="text-lg sm:text-xl font-black" style={{ color: '#1a2f4e' }}>{cart.total_amount.toLocaleString()}</span>
            <span className="text-xs ml-1.5" style={{ color: '#bbb' }}>{cart.currency}</span>
          </div>
        </div>
      </div>

      {/* Payment info banner */}
      <div className="flex items-start gap-3 rounded-2xl p-4 mb-4 text-sm" style={{ background: '#eff6ff', border: '1px solid #dbeafe', color: '#1d4ed8' }}>
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs sm:text-sm leading-relaxed">{t('payInfo')}</span>
      </div>

      {/* Offer agreement — large tap area */}
      <label
        className="flex items-start gap-3 rounded-2xl p-4 mb-4 cursor-pointer select-none transition-all"
        style={{
          background: '#fff',
          border: `1.5px solid ${agreed ? '#1a2f4e' : '#e8e5e0'}`,
          boxShadow: agreed ? '0 0 0 3px rgba(26,47,78,0.07)' : 'none',
          minHeight: 56,
        }}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="sr-only"
          />
          <div
            className="flex items-center justify-center transition-all"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: agreed ? '#1a2f4e' : '#f7f5f2',
              border: `2px solid ${agreed ? '#1a2f4e' : '#d0cdc9'}`,
            }}
          >
            {agreed && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-xs sm:text-sm leading-relaxed" style={{ color: '#555' }}>
          {t('agreeToOffer')}{' '}
          <Link
            to="/public-offer"
            target="_blank"
            onClick={e => e.stopPropagation()}
            className="font-semibold underline transition-colors"
            style={{ color: '#1a2f4e' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff4d1c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#1a2f4e')}
          >
            {t('publicOfferLink')}
          </Link>
        </span>
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 text-xs px-4 py-3.5 rounded-xl mb-4 font-medium" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Place order CTA */}
      <button
        onClick={() => { setError(''); orderMutation.mutate() }}
        disabled={orderMutation.isPending || !agreed}
        className="w-full text-white rounded-2xl font-bold text-sm transition-all mb-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #1a2f4e, #243c61)',
          boxShadow: '0 4px 16px rgba(26,47,78,0.25)',
          height: 52,
        }}
        onMouseEnter={e => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,77,28,0.4)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #1a2f4e, #243c61)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,47,78,0.25)'
        }}
      >
        {orderMutation.isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
            </svg>
            {t('placingOrder')}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('placeOrder')}
          </>
        )}
      </button>
    </div>
  )
}
