import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart } from '../api/cart'
import { createOrderFromCart, initPayment } from '../api/orders'
import { useState } from 'react'
import type { Order } from '../types'
import { useLang } from '../store/lang'
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
    mutationFn: () => createOrderFromCart(data!.data.id, data!.data.total_amount),
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

  if (isLoading) return (
    <div className="max-w-md mx-auto h-64 rounded-3xl mt-4 shimmer" style={{ background: '#fff' }} />
  )

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <p style={{ color: '#888' }}>{t('cartEmpty')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm underline transition-colors" style={{ color: '#ff4d1c' }}>
          {t('browseShop')}
        </button>
      </div>
    )
  }

  if (createdOrder) {
    const orderId = Number(createdOrder.order_id.replace('order_', ''))
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="rounded-3xl p-10" style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#f0fdf4' }}>
            <svg className="w-8 h-8" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black mb-1" style={{ color: '#1a2f4e' }}>{t('orderPlaced')}</h2>
          <p className="text-sm mb-1" style={{ color: '#888' }}>{createdOrder.order_id}</p>
          <p className="text-2xl font-black mt-3 mb-8" style={{ color: '#1a2f4e' }}>{(createdOrder.total_amount / 100).toLocaleString()} UZS</p>
          <div className="space-y-3">
            <button
              onClick={() => initPayment(orderId, createdOrder.total_amount / 100)}
              className="w-full text-white py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{ background: '#ff4d1c' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e03c10')}
              onMouseLeave={e => (e.currentTarget.style.background = '#ff4d1c')}
            >
              {t('payNowBank')}
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="w-full py-3 rounded-2xl font-medium text-sm transition-all"
              style={{ border: '1px solid #e8e5e0', color: '#888' }}
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

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-black mb-8" style={{ color: '#1a2f4e' }}>{t('checkoutTitle')}</h1>

      <div className="rounded-3xl p-6 mb-4" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: '#1a2f4e' }}>{t('orderSummary')}</h2>
        <div className="space-y-3 mb-5">
          {cart.items.map((item) => (
            <div key={item.product_id} className="flex justify-between text-sm">
              <span className="truncate mr-4" style={{ color: '#888' }}>{item.name} × {item.quantity}</span>
              <span className="font-semibold flex-shrink-0" style={{ color: '#1a2f4e' }}>{item.subtotal.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center" style={{ borderTop: '1px solid #e8e5e0', paddingTop: 16 }}>
          <span className="font-bold" style={{ color: '#1a2f4e' }}>{t('total')}</span>
          <div className="text-right">
            <span className="text-xl font-black" style={{ color: '#1a2f4e' }}>{cart.total_amount.toLocaleString()}</span>
            <span className="text-xs ml-1" style={{ color: '#888' }}>{cart.currency}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl p-4 mb-6 text-sm" style={{ background: '#eff6ff', border: '1px solid #dbeafe', color: '#1d4ed8' }}>
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('payInfo')}
      </div>

      {/* Offer agreement */}
      <label className="flex items-start gap-3 rounded-2xl p-4 mb-4 cursor-pointer select-none"
        style={{ background: '#fff', border: `1.5px solid ${agreed ? '#1a2f4e' : '#e8e5e0'}`, transition: 'border-color 0.15s' }}>
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="sr-only"
          />
          <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
            style={{ background: agreed ? '#1a2f4e' : '#f7f5f2', border: `2px solid ${agreed ? '#1a2f4e' : '#d0cdc9'}` }}>
            {agreed && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-xs leading-relaxed" style={{ color: '#555' }}>
          {t('agreeToOffer')}{' '}
          <Link
            to="/public-offer"
            target="_blank"
            onClick={e => e.stopPropagation()}
            className="font-semibold underline"
            style={{ color: '#1a2f4e' }}
          >
            {t('publicOfferLink')}
          </Link>
        </span>
      </label>

      {error && (
        <div className="text-xs px-4 py-3 rounded-xl mb-4 font-medium" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>{error}</div>
      )}

      <button
        onClick={() => { setError(''); orderMutation.mutate() }}
        disabled={orderMutation.isPending || !agreed}
        className="w-full text-white py-4 rounded-2xl font-bold text-sm transition-all mb-3 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#1a2f4e' }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#ff4d1c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1a2f4e' }}
      >
        {orderMutation.isPending ? t('placingOrder') : t('placeOrder')}
      </button>
      <button
        onClick={() => navigate('/cart')}
        className="w-full py-3 rounded-2xl font-medium text-sm transition-all"
        style={{ border: '1px solid #e8e5e0', color: '#888' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' }}
      >
        {t('backToCart')}
      </button>
    </div>
  )
}
