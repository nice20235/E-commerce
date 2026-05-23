import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../../api/orders'
import type { Order } from '../../types'
import { useLang } from '../../store/lang'
import { getImageUrl } from '../../utils/image'

const STATUS_CONFIG: Record<Order['status'], {
  dotColor: string
  textColor: string
  bg: string
  label: { uz: string; ru: string }
}> = {
  PENDING:  { dotColor: '#f59e0b', textColor: '#92400e', bg: '#fffbeb', label: { uz: 'Kutilmoqda', ru: 'Ожидает' } },
  PAID:     { dotColor: '#4ade80', textColor: '#166534', bg: '#f0fdf4', label: { uz: "To'langan", ru: 'Оплачен' } },
  REFUNDED: { dotColor: '#9ca3af', textColor: '#4b5563', bg: '#f3f4f6', label: { uz: 'Qaytarilgan', ru: 'Возврат' } },
}
const STATUS_OPTIONS: Order['status'][] = ['PENDING', 'PAID', 'REFUNDED']

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

const ITEMS_PER_PAGE = 50

export default function AllOrders() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'ALL'>('ALL')
  const [page, setPage] = useState(0)
  const { t, lang } = useLang()

  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ['orders', 'admin', page, filterStatus],
    queryFn: () => getOrders(
      page * ITEMS_PER_PAGE,
      ITEMS_PER_PAGE,
      filterStatus === 'ALL' ? undefined : filterStatus,
    ),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  })

  const allOrders = ordersData?.orders ?? []
  const serverTotal = ordersData?.total ?? 0

  // Status filter is applied server-side; allOrders is already filtered
  const pageOrders = allOrders

  // Reset to first page whenever the filter changes
  useEffect(() => {
    setPage(0)
  }, [filterStatus])

  const filterLabel = (s: Order['status'] | 'ALL') => {
    if (s === 'ALL') return lang === 'uz' ? 'Barchasi' : 'Все'
    return STATUS_CONFIG[s].label[lang]
  }

  if (isLoading) {
    return (
      <div>
        <div className="h-7 shimmer rounded-xl w-40 mb-5 sm:mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="flex items-center gap-4 px-4 sm:px-5 py-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 shimmer rounded w-1/3" />
                  <div className="h-3 shimmer rounded w-1/4" />
                </div>
                <div className="h-6 shimmer rounded-full w-20" />
                <div className="text-right space-y-1.5">
                  <div className="h-4 shimmer rounded w-20" />
                  <div className="h-3 shimmer rounded w-10 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>Failed to load orders.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header + filter */}
      <div className="flex flex-col gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-black" style={{ color: '#1a2f4e' }}>{t('allOrders')}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#888' }}>
            {serverTotal} {lang === 'uz' ? 'ta buyurtma' : 'заказов'}
            {(serverTotal) > ITEMS_PER_PAGE && (
              <span style={{ color: '#bbb' }}>
                {' '}({lang === 'uz' ? `Sahifa ${page + 1}` : `Страница ${page + 1}`})
              </span>
            )}
          </p>
        </div>

        {/* Status filter chips — horizontal scroll on mobile */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {(['ALL', ...STATUS_OPTIONS] as const).map((s) => {
            const isActive = filterStatus === s
            const cfg = s !== 'ALL' ? STATUS_CONFIG[s] : null
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="inline-flex items-center gap-1.5 text-xs rounded-full font-semibold transition-all flex-shrink-0"
                style={{
                  background: isActive ? '#1a2f4e' : '#fff',
                  color: isActive ? '#fff' : '#888',
                  border: `1.5px solid ${isActive ? '#1a2f4e' : '#e8e5e0'}`,
                  boxShadow: isActive ? '0 2px 8px rgba(26,47,78,0.2)' : 'none',
                  padding: '8px 12px',
                  minHeight: 36,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#1a2f4e'
                    e.currentTarget.style.color = '#1a2f4e'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#e8e5e0'
                    e.currentTarget.style.color = '#888'
                  }
                }}
              >
                {cfg && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: isActive ? '#fff' : cfg.dotColor }}
                  />
                )}
                {filterLabel(s)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {!pageOrders.length && (
        <div className="rounded-2xl p-10 sm:p-12 text-center" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f0ede8' }}>
            <svg className="w-7 h-7" style={{ color: '#ccc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: '#888' }}>{t('noOrdersFound')}</p>
        </div>
      )}

      {/* Orders list */}
      {!!pageOrders?.length && (
        <div className="space-y-3">
          {pageOrders.map((order) => {
            const isExpanded = expandedId === order.order_id
            const s = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
            const statusLabel = s.label[lang] ?? order.status
            const totalAmount = Number(order.total_amount) || 0
            const itemCount = order.items?.length ?? 0

            return (
              <div
                key={order.order_id}
                className="rounded-2xl overflow-hidden transition-shadow"
                style={{
                  background: '#fff',
                  boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.11)' : '0 2px 16px rgba(0,0,0,0.07)',
                }}
              >
                {/* Collapsed row */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 cursor-pointer transition-colors text-left"
                  style={{ color: '#1a2f4e', background: 'transparent' }}
                  onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#faf9f7' }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Left: order ID + user */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-semibold" style={{ color: '#1a2f4e', wordBreak: 'break-all' }}>{order.order_id}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: s.bg }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dotColor }} />
                        <span className="text-[10px] font-bold" style={{ color: s.textColor }}>{statusLabel}</span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.user_name ?? `User #${order.user_id}`}
                      {' · '}
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  {/* Right: amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm" style={{ color: '#1a2f4e' }}>
                      {(totalAmount / 100).toLocaleString()}
                      <span className="text-[10px] ml-0.5 font-normal" style={{ color: '#ccc' }}>UZS</span>
                    </p>
                    <p className="text-xs" style={{ color: '#bbb' }}>
                      {itemCount} {itemCount !== 1 ? 'items' : 'item'}
                    </p>
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    style={{ color: '#ccc' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    className="px-4 sm:px-5 py-4 sm:py-5 fade-up"
                    style={{ borderTop: '1px solid #e8e5e0', background: '#faf9f7' }}
                  >
                    {/* Items */}
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#bbb' }}>
                      {t('orderItems')}
                    </p>
                    <div className="space-y-2.5 mb-5">
                      {(order.items ?? []).map((item, idx) => (
                        <div key={`${item.slipper_id}-${idx}`} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name ?? ''}
                                loading="lazy"
                                decoding="async"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                style={{ background: '#f0ede8' }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: '#f0ede8' }} />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm truncate" style={{ color: '#444' }}>{item.name}</p>
                              {item.size && <p className="text-xs" style={{ color: '#bbb' }}>Size {item.size}</p>}
                            </div>
                            <span className="text-xs flex-shrink-0" style={{ color: '#bbb' }}>× {item.quantity}</span>
                          </div>
                          <span className="text-sm font-semibold flex-shrink-0" style={{ color: '#1a2f4e' }}>
                            {(Number(item.total_price) || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination controls */}
      {serverTotal > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-xl font-medium transition-all disabled:opacity-40"
            style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', padding: '10px 18px', fontSize: 14, minHeight: 44 }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a2f4e' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e8e5e0' }}
          >
            {lang === 'uz' ? 'Oldingi' : 'Назад'}
          </button>
          <span className="rounded-xl font-medium flex items-center justify-center" style={{ background: '#f7f5f2', color: '#888', padding: '10px 18px', fontSize: 14 }}>
            {page + 1} / {Math.ceil(serverTotal / ITEMS_PER_PAGE)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * ITEMS_PER_PAGE >= serverTotal}
            className="rounded-xl font-medium transition-all disabled:opacity-40"
            style={{ border: '1.5px solid #e8e5e0', color: '#888', background: '#fff', padding: '10px 18px', fontSize: 14, minHeight: 44 }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#1a2f4e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a2f4e' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e8e5e0' }}
          >
            {lang === 'uz' ? 'Keyingi' : 'Вперёд'}
          </button>
        </div>
      )}
    </div>
  )
}
