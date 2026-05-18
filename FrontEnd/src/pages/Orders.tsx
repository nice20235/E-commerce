import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../api/orders'
import { Link } from 'react-router-dom'
import type { Order } from '../types'
import { useLang } from '../store/lang'

const STATUS_STYLES: Record<Order['status'], { dotColor: string; textColor: string; bg: string }> = {
  PENDING:  { dotColor: '#f59e0b', textColor: '#92400e', bg: '#fffbeb' },
  PAID:     { dotColor: '#4ade80', textColor: '#166534', bg: '#f0fdf4' },
  REFUNDED: { dotColor: '#9ca3af', textColor: '#4b5563', bg: '#f3f4f6' },
}

export default function Orders() {
  const { t } = useLang()
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl h-28 shimmer" style={{ background: '#fff' }} />)}
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

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>
          📦
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#1a2f4e' }}>{t('noOrders')}</h2>
        <p className="text-sm mb-8" style={{ color: '#888' }}>{t('noOrdersSub')}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all"
          style={{ background: '#1a2f4e' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ff4d1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a2f4e')}
        >
          {t('startShopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-black mb-8" style={{ color: '#1a2f4e' }}>{t('myOrders')}</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING
          const numericId = Number(order.order_id.replace('order_', ''))
          return (
            <div key={order.order_id} className="rounded-2xl p-5 transition-shadow" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold" style={{ color: '#1a2f4e' }}>{(order.total_amount / 100).toLocaleString()} UZS</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: s.bg }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dotColor }} />
                  <span className="text-xs font-semibold" style={{ color: s.textColor }}>{order.status}</span>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.slipper_id} className="flex justify-between text-xs">
                    <span className="truncate mr-4" style={{ color: '#888' }}>{item.name} × {item.quantity}</span>
                    <span className="font-medium flex-shrink-0" style={{ color: '#1a2f4e' }}>{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs" style={{ color: '#888' }}>+{order.items.length - 3} more</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #e8e5e0' }}>
                <p className="text-xs" style={{ color: '#888' }}>{order.created_at}</p>
                {order.status === 'PENDING' && (
                  <a
                    href={`/api/payment/init/${numericId}?amount=${order.total_amount}`}
                    className="text-xs text-white px-4 py-1.5 rounded-full font-semibold transition-colors"
                    style={{ background: '#ff4d1c' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e03c10')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ff4d1c')}
                  >
                    {t('payNow')}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
