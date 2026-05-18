import client from './client'
import type { Order } from '../types'

export const getOrders = () =>
  client.get<Order[]>('/orders/').then((r) => r.data)

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
 * @param amountUzs - total amount in UZS (will be converted to tiyin × 100)
 */
export const initPayment = (orderId: number, amountUzs: number) => {
  window.location.href = `/api/payment/init/${orderId}?amount=${Math.round(amountUzs * 100)}`
}
