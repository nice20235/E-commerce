export interface User {
  name: string
  surname: string
  phone_number: string
  is_admin: boolean
  created_at: string
}

export interface AuthResponse {
  user: User
}

export interface ProductImage {
  id: number
  image_path: string
  is_primary: boolean
  alt_text: string | null
  order_index: number
}

export interface Product {
  id: number
  name: string
  size: string
  price: number
  quantity: number
  image: string | null
  images?: ProductImage[]
  is_available: boolean
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  pages: number
  has_next: boolean
  has_prev: boolean
  sort: string
}

export interface CartItem {
  cart_item_id: number
  product_id: number
  name: string
  price: number
  quantity: number
  subtotal: number
  image: string | null
}

export interface CartData {
  id: string
  items: CartItem[]
  total_amount: number
  currency: string
  items_count: number
}

export interface CartResponse {
  status: string
  data: CartData
}

export interface OrderItem {
  slipper_id: number
  quantity: number
  unit_price: number
  total_price: number
  name: string | null
  size: string | null
  image: string | null
  notes?: string | null
}

export interface Order {
  order_id: string
  user_id: number
  user_name?: string | null
  status: 'PENDING' | 'PAID' | 'REFUNDED'
  total_amount: number
  notes: string | null
  created_at: string
  updated_at?: string
  items: OrderItem[]
}

export type SortOption =
  | 'id_desc'
  | 'id_asc'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'created_asc'
  | 'created_desc'


export interface UserProfile {
  name: string
  surname: string
  phone_number: string
  is_admin: boolean
}

export interface UserListItem {
  id: number
  name: string
  surname: string
  phone_number: string
  is_admin: boolean
  created_at: string
}

export interface UserListResponse {
  items: UserListItem[]
  total: number
  page: number
  pages: number
  has_next: boolean
  has_prev: boolean
}
