import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'
import HODDashboard from '../pages/HODDashboard'
import TimetableHome from '../pages/TimetableHome'

const TIMETABLE_ONLY_EMAIL = 'shanmugasundaram@college.edu'

function isTimetableOnlyUser(user) {
  return user?.email?.toLowerCase() === TIMETABLE_ONLY_EMAIL
}

function getHomePath(user) {
  if (!user) return '/login'
  return isTimetableOnlyUser(user) ? '/timetable' : '/hod'
}

function ProtectedRoute({ children, roles, onlyTimetableUser = false }) {
  const { user, loading } = useAuth()
  if (loading) return null // still restoring session
  if (!user) return <Navigate to="/login" replace />
  if (onlyTimetableUser && !isTimetableOnlyUser(user)) {
    return <Navigate to="/hod" replace />
  }
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={getHomePath(user)} replace />
  }
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          loading ? null : user ? <Navigate to={getHomePath(user)} replace /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={
          loading ? null : user ? <Navigate to={getHomePath(user)} replace /> : <Login />
        }
      />
      <Route
        path="/hod"
        element={
          <ProtectedRoute roles={['HOD']}>
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timetable"
        element={
          <ProtectedRoute roles={['HOD', 'STAFF']} onlyTimetableUser>
            <TimetableHome />
          </ProtectedRoute>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
