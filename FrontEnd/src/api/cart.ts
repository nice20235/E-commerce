import client from './client'
import type { CartResponse } from '../types'

export const getCart = () =>
  client.get<CartResponse>('/cart').then((r) => r.data)

export const addToCart = (product_id: number, quantity: number) =>
  client.post<CartResponse>('/cart/items', { product_id, quantity }).then((r) => r.data)

export const updateCartItem = (cart_item_id: number, quantity: number) =>
  client.put<CartResponse>(`/cart/items/${cart_item_id}`, { quantity }).then((r) => r.data)

export const removeCartItem = (cart_item_id: number) =>
  client.delete<CartResponse>(`/cart/items/${cart_item_id}`).then((r) => r.data)

export const clearCart = () =>
  client.delete<CartResponse>('/cart/clear').then((r) => r.data)
