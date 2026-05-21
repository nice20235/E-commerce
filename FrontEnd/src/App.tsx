import { useEffect } from 'react'
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

export default function App() {
  const { isAuthenticated, user, setAuth, setVerifying } = useAuthStore()

  // Fetch /users/me on every load to confirm the real is_admin value.
  // is_admin is not stored in localStorage, so it must be re-verified here.
  // Always re-fetch so demoted admins lose access immediately on session restore.
  useEffect(() => {
    if (isAuthenticated && user) {
      getMe().then((profile) => {
        setAuth({ ...user, ...profile })
      }).catch(() => {
        // getMe failed (e.g. server error). Unblock admin gate so the user
        // is not stuck on a spinner; they may be redirected to "/" if not admin.
        setVerifying(false)
      })
    }
  // user?.name ensures we only re-run when the logged-in identity changes,
  // not on every shallow object update, avoiding an infinite loop.
  }, [isAuthenticated, user?.name, setAuth, setVerifying])

  return (
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
  )
}
