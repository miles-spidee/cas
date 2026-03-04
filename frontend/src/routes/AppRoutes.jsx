import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import StaffDashboard from '../pages/StaffDashboard'
import HODDashboard from '../pages/HODDashboard'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/staff-dashboard" element={<StaffDashboard />} />
      <Route path="/hod-dashboard" element={<HODDashboard />} />
    </Routes>
  )
}

export default AppRoutes
