import client from './client'
import type { UserProfile, UserListResponse } from '../types'

export const getMe = () =>
  client.get<UserProfile>('/users/me').then((r) => r.data)

export interface ProfileUpdatePayload {
  name?: string
  surname?: string
  phone_number?: string
  current_password?: string
  new_password?: string
  confirm_new_password?: string
}

export const updateMe = (data: ProfileUpdatePayload) =>
  client.put<UserProfile>('/users/me', data).then((r) => r.data)

export const getUsers = (skip = 0, limit = 20, search?: string) =>
  client
    .get<UserListResponse>('/users/', { params: { skip, limit, search } })
    .then((r) => r.data)

export const deleteUser = (id: number) =>
  client.delete(`/users/${id}`).then((r) => r.data)

export interface AdminUserUpdatePayload {
  name?: string
  surname?: string
  phone_number?: string
  is_admin?: boolean
}

export const updateUser = (id: number, data: AdminUserUpdatePayload) =>
  client.put<UserProfile>(`/users/${id}`, data).then((r) => r.data)
