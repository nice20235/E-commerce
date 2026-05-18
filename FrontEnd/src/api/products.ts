import client from './client'
import type { Product, ProductImage, ProductListResponse, SortOption } from '../types'

export interface ProductFilters {
  skip?: number
  limit?: number
  search?: string
  sort?: SortOption
}

export const getProducts = (filters: ProductFilters = {}) => {
  const params: Record<string, string | number> = {}
  if (filters.skip !== undefined) params.skip = filters.skip
  if (filters.limit !== undefined) params.limit = filters.limit
  if (filters.sort !== undefined) params.sort = filters.sort
  if (filters.search) params.search = filters.search
  return client.get<ProductListResponse>('/stepups/', { params }).then((r) => r.data)
}

export const getProduct = (id: number, include_images = true) =>
  client.get<Product>(`/stepups/${id}`, { params: { include_images } }).then((r) => r.data)

export interface ProductCreatePayload {
  name: string
  size: string
  price: number
  quantity: number
}

export const createProduct = (data: ProductCreatePayload) =>
  client.post<Product>('/stepups/', data).then((r) => r.data)

export const updateProduct = (id: number, data: Partial<ProductCreatePayload>) =>
  client.put<Product>(`/stepups/${id}`, data).then((r) => r.data)

export const deleteProduct = (id: number) =>
  client.delete(`/stepups/${id}`).then((r) => r.data)

export const uploadProductImages = (id: number, files: File[]) => {
  const form = new FormData()
  files.forEach((f) => form.append('images', f))
  return client
    .post(`/stepups/${id}/upload-images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const deleteProductImage = (productId: number, imageId: number) =>
  client.delete(`/stepups/${productId}/images/${imageId}`).then((r) => r.data)

export const getProductImages = (id: number) =>
  client.get<ProductImage[]>(`/stepups/${id}/images`).then((r) => r.data)
