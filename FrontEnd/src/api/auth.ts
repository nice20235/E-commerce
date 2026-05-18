import client from './client'
import type { AuthResponse } from '../types'

export interface LoginPayload {
  name: string
  password: string
}

export interface RegisterPayload {
  name: string
  surname: string
  phone_number: string
  password: string
  confirm_password: string
}

export const login = (data: LoginPayload) =>
  client.post<AuthResponse>('/auth/login', data).then((r) => r.data)

export const register = (data: RegisterPayload) =>
  client.post<AuthResponse>('/auth/register', data).then((r) => r.data)

export const logout = () =>
  client.post('/auth/logout').then((r) => r.data)

export const forgotPassword = (name: string, new_password: string) =>
  client.post('/auth/forgot-password', { name, new_password, confirm_new_password: new_password }).then((r) => r.data)
