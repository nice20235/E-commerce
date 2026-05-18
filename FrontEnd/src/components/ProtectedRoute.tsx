import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (adminOnly && !user?.is_admin) return <Navigate to="/" replace />

  return <>{children}</>
}
