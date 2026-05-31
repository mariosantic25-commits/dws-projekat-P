import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin } = useAuth()
  const location = useLocation()

  if (!user) {
    // Spremanje gdje je korisnik htio ići, redirect nakon logina
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}