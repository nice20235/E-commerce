import { useEffect, Component, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { getMe } from './api/users'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import PublicOffer from './pages/PublicOffer'
import AdminLayout from './pages/admin/AdminLayout'
import AdminProducts from './pages/admin/Products'
import AllOrders from './pages/admin/AllOrders'
import AdminUsers from './pages/admin/Users'

class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false }
  static getDerivedStateFromError() { return { crashed: true } }
  componentDidCatch(err: Error) { console.error('[ErrorBoundary]', err) }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, fontFamily: 'sans-serif' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1a2f4e' }}>Что-то пошло не так</p>
          <p style={{ fontSize: 14, color: '#888' }}>Пожалуйста, обновите страницу</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', borderRadius: 12, background: '#1a2f4e', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Обновить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { isAuthenticated, user, setAuth, setVerifying } = useAuthStore()

  // Fetch /users/me on every load to confirm the real is_admin value.
  // is_admin is not stored in localStorage, so it must be re-verified here.
  // Always re-fetch so demoted admins lose access immediately on session restore.
  useEffect(() => {
    if (isAuthenticated && user) {
      getMe().then((profile) => {
        setAuth({ ...user, ...profile })
      }).catch((err) => {
        console.warn('[auth] getMe failed — admin role unverified:', err?.response?.status ?? err?.message)
        setVerifying(false)
      })
    }
  // user?.name ensures we only re-run when the logged-in identity changes,
  // not on every shallow object update, avoiding an infinite loop.
  }, [isAuthenticated, user?.name, setAuth, setVerifying])

  return (
    <ErrorBoundary>
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/public-offer" element={<PublicOffer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Authenticated */}
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/products" replace />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AllOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
    </ErrorBoundary>
  )
}
