import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../api/orders'
import type { Order } from '../../types'
import { useLang } from '../../store/lang'

const STATUS_STYLES: Record<Order['status'], { dotColor: string; textColor: string; bg: string }> = {
  PENDING:  { dotColor: '#f59e0b', textColor: '#92400e', bg: '#fffbeb' },
  PAID:     { dotColor: '#4ade80', textColor: '#166534', bg: '#f0fdf4' },
  REFUNDED: { dotColor: '#9ca3af', textColor: '#4b5563', bg: '#f3f4f6' },
}
const STATUS_OPTIONS: Order['status'][] = ['PENDING', 'PAID', 'REFUNDED']

export default function AllOrders() {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'ALL'>('ALL')
  const { t } = useLang()

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    staleTime: 15_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Order['status'] }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const filtered = orders?.filter(
    (o) => filterStatus === 'ALL' || o.status === filterStatus
  )

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-2xl h-16 shimmer" style={{ background: '#fff' }} />)}
    </div>
  )

  if (isError) return <p className="text-sm font-medium" style={{ color: '#ff4d1c' }}>Failed to load orders.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black" style={{ color: '#1a2f4e' }}>
          {t('allOrders')}
          <span className="ml-2 text-sm font-normal" style={{ color: '#888' }}>({filtered?.length ?? 0})</span>
        </h1>
        <div className="flex gap-1.5">
          {(['ALL', ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{
                background: filterStatus === s ? '#1a2f4e' : '#fff',
                color: filterStatus === s ? '#fff' : '#888',
                border: `1px solid ${filterStatus === s ? '#1a2f4e' : '#e8e5e0'}`,
              }}
              onMouseEnter={e => { if (filterStatus !== s) { e.currentTarget.style.borderColor = '#1a2f4e'; e.currentTarget.style.color = '#1a2f4e' } }}
              onMouseLeave={e => { if (filterStatus !== s) { e.currentTarget.style.borderColor = '#e8e5e0'; e.currentTarget.style.color = '#888' } }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {!filtered?.length ? (
        <div className="rounded-2xl p-12 text-center text-sm" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', color: '#888' }}>
          {t('noOrdersFound')}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const numericId = Number(order.order_id.replace('order_', ''))
            const isExpanded = expandedId === order.order_id
            const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING

            return (
              <div key={order.order_id} className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} order ${order.order_id}`}
                  className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors text-left"
                  style={{ color: '#1a2f4e', background: 'transparent' }}
                  onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#faf9f7')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium" style={{ color: '#1a2f4e' }}>{order.order_id}</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: s.bg }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dotColor }} />
                        <span className="text-[10px] font-bold" style={{ color: s.textColor }}>{order.status}</span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: '#888' }}>{order.user_name ?? `User #${order.user_id}`} · {order.created_at}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#1a2f4e' }}>{(order.total_amount / 100).toLocaleString()} UZS</p>
                    <p className="text-xs" style={{ color: '#888' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    style={{ color: '#888' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(232,229,224,0.6)', background: 'rgba(247,245,242,0.3)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#888' }}>{t('orderItems')}</p>
                    <div className="space-y-2 mb-5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2" style={{ color: '#888' }}>
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name ?? ''}
                                className="w-7 h-7 rounded-lg object-cover"
                              />
                            )}
                            {item.name} <span style={{ color: 'rgba(136,136,136,0.6)' }}>× {item.quantity}</span>
                            {item.size && <span className="text-xs" style={{ color: 'rgba(136,136,136,0.5)' }}>({item.size})</span>}
                          </span>
                          <span className="font-semibold" style={{ color: '#1a2f4e' }}>{item.total_price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: '#888' }}>{t('setStatus')}</span>
                      {STATUS_OPTIONS.filter((st) => st !== order.status).map((st) => (
                        <button
                          key={st}
                          onClick={() => updateMutation.mutate({ id: numericId, status: st })}
                          disabled={updateMutation.isPending}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40"
                          style={{ border: '1px solid #e8e5e0', background: '#fff', color: '#1a2f4e' }}
                          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#f7f5f2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                        >
                          → {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
