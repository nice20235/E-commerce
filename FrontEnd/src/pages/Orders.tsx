import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../api/orders'
import { Link } from 'react-router-dom'
import type { Order } from '../types'
import { useLang } from '../store/lang'

const STATUS_CONFIG: Record<Order['status'], {
  dotColor: string
  textColor: string
  bg: string
  label: { uz: string; ru: string }
}> = {
  PENDING:  { dotColor: '#f59e0b', textColor: '#92400e', bg: '#fffbeb', label: { uz: 'Kutilmoqda', ru: 'Ожидает' } },
  PAID:     { dotColor: '#4ade80', textColor: '#166534', bg: '#f0fdf4', label: { uz: 'To\'langan', ru: 'Оплачен' } },
  REFUNDED: { dotColor: '#9ca3af', textColor: '#4b5563', bg: '#f3f4f6', label: { uz: 'Qaytarilgan', ru: 'Возврат' } },
}

function formatDate(raw: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(raw))
  } catch {
    return raw
  }
}

export default function Orders() {
  const { t, lang } = useLang()
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 shimmer rounded-xl w-36 mb-6 sm:mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 shimmer rounded w-1/3" />
                <div className="h-6 shimmer rounded-full w-20" />
              </div>
              <div className="h-3 shimmer rounded w-1/2" />
              <div className="h-3 shimmer rounded w-2/5" />
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

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 sm:py-24 px-4">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6"
          style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}
        >
          <svg className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: '#d0cdc9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-2" style={{ color: '#1a2f4e' }}>{t('noOrders')}</h2>
        <p className="text-sm mb-7 sm:mb-8 max-w-xs mx-auto" style={{ color: '#888' }}>{t('noOrdersSub')}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white px-6 py-3.5 rounded-full font-bold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #1a2f4e, #243c61)', boxShadow: '0 4px 16px rgba(26,47,78,0.25)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d1c, #ff6a3c)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,77,28,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1a2f4e, #243c61)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,47,78,0.25)' }}
        >
          {t('startShopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black" style={{ color: '#1a2f4e' }}>{t('myOrders')}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#888' }}>{orders.length} {t('ordersCount')}</p>
        </div>
      </div>

      <div className="space-y-4 fade-up">
        {orders.map((order) => {
          const s = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
          const numericId = Number(order.order_id.replace('order_', ''))
          const statusLabel = s.label[lang] ?? order.status

          return (
            <div
              key={order.order_id}
              className="rounded-2xl overflow-hidden transition-shadow"
              style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
            >
              {/* Header row */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                  <div className="min-w-0">
                    {/* Amount */}
                    <p className="text-lg sm:text-xl font-black" style={{ color: '#1a2f4e', letterSpacing: '-0.01em' }}>
                      {(order.total_amount / 100).toLocaleString()}
                      <span className="text-sm font-medium ml-1.5" style={{ color: '#bbb' }}>UZS</span>
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: s.bg }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dotColor }} />
                    <span className="text-xs font-bold" style={{ color: s.textColor }}>{statusLabel}</span>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2 mb-3 sm:mb-4">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={`${item.slipper_id}-${idx}`} className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {(item as { image?: string }).image ? (
                          <img
                            src={(item as { image?: string }).image ?? ''}
                            alt={item.name ?? ''}
                            className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                            style={{ background: '#f0ede8' }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: '#f0ede8' }} />
                        )}
                        <span className="truncate" style={{ color: '#888' }}>
                          {item.name}
                          <span className="ml-1" style={{ color: '#ccc' }}>× {item.quantity}</span>
                        </span>
                      </div>
                      <span className="font-semibold flex-shrink-0" style={{ color: '#1a2f4e' }}>
                        {item.total_price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs pl-9" style={{ color: '#bbb' }}>
                      +{order.items.length - 3} {t('moreItems')}
                    </p>
                  )}
                </div>

                {/* Footer row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-0 sm:justify-between pt-3 sm:pt-4" style={{ borderTop: '1px solid #f0ede8' }}>
                  <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: '#bbb' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{formatDate(order.created_at)}</span>
                  </div>

                  {order.status === 'PENDING' && (
                    <a
                      href={`/api/payment/init/${numericId}?amount=${order.total_amount}`}
                      className="inline-flex items-center justify-center gap-1.5 text-xs text-white rounded-full font-bold transition-all w-full sm:w-auto flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #ff4d1c, #ff6a3c)',
                        boxShadow: '0 2px 10px rgba(255,77,28,0.35)',
                        padding: '11px 20px',
                        minHeight: 44,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,77,28,0.5)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(255,77,28,0.35)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      {t('payNow')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
