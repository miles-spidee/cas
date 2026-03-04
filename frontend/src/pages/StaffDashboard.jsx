import { useNavigate } from 'react-router-dom'

function StaffDashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h2>Staff Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>
      <main className="dashboard-content">
        <h1>Welcome to Staff Dashboard</h1>
        <p>Your attendance and timetable information will be displayed here.</p>
      </main>
    </div>
  )
}

export default StaffDashboard
