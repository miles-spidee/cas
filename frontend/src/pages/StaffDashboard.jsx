import { useNavigate } from 'react-router-dom'
import '../styles/global.css'

function StaffDashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="staff-page">
      {/* Header */}
      <header className="staff-header">
        <h1 className="staff-header__title">Staff Dashboard</h1>
        <div className="staff-header__right">
          <span className="staff-header__subtitle">Class Alter System</span>
          <button onClick={handleLogout} className="staff-logout-btn">Logout</button>
        </div>
      </header>

      {/* Body */}
      <main className="staff-body">
        <section className="staff-panel">
          <h2 className="staff-panel__heading">Welcome</h2>
          <p className="staff-panel__text">Your attendance and timetable information will be displayed here.</p>
        </section>
      </main>
    </div>
  )
}

export default StaffDashboard
