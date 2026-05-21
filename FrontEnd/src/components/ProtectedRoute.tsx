import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { isAuthenticated, user, isVerifying } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  // Hold admin-gated routes until /users/me confirms the real is_admin value.
  // This prevents admins from being redirected to "/" on every page refresh
  // because is_admin is not stored in localStorage for security reasons.
  if (adminOnly && isVerifying) {
    return (
      <div className="flex items-center justify-center h-40">
        <div
          className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: '#e8e5e0', borderTopColor: '#1a2f4e' }}
        />
      </div>
    )
  }

  if (adminOnly && !user?.is_admin) return <Navigate to="/" replace />

  return <>{children}</>
}
