import client from './client'
import type { Order } from '../types'

export interface PaginatedOrders {
  orders: Order[]
  total: number
  skip: number
  limit: number
}

export const getOrders = (skip = 0, limit = 50, status?: string) => {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (status && status !== 'ALL') params.set('status', status)
  return client.get<PaginatedOrders>(`/orders/?${params}`).then((r) => r.data)
}

export const getOrder = (id: number) =>
  client.get<Order>(`/orders/${id}`).then((r) => r.data)

export const createOrderFromCart = (cart_id: string, amount: number) =>
  client.post<Order>('/orders/from-cart', { cart_id, amount: Math.round(amount) }).then((r) => r.data)

export const updateOrderStatus = (id: number, status: Order['status']) =>
  client.put<Order>(`/orders/${id}`, { status }).then((r) => r.data)

export const deleteOrder = (id: number) =>
  client.delete(`/orders/${id}`).then((r) => r.data)

/**
 * Redirects the user to the bank payment page.
 * @param orderId - numeric order id
 * @param amountTiyin - total amount in tiyin (UZS × 100), as stored in order.total_amount
 */
export const initPayment = (orderId: number, amountTiyin: number) => {
  // Resolve against the same API base axios uses so we don't break in
  // deployments where the frontend and backend are on different hosts
  // (e.g. stepupp.uz vs api.stepupp.uz).
  const base = (import.meta.env.VITE_API_URL ?? '/').replace(/\/$/, '')
  window.location.href = `${base}/api/payment/init/${orderId}?amount=${Math.round(amountTiyin)}`
}
