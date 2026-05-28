import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 border-4 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-400">Loading PaySplit…</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}
