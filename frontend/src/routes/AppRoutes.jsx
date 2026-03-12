import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'
import HODDashboard from '../pages/HODDashboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null // still restoring session
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          loading ? null : user ? <Navigate to="/hod" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={
          loading ? null : user ? <Navigate to="/hod" replace /> : <Login />
        }
      />
      <Route
        path="/hod"
        element={
          <ProtectedRoute>
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
