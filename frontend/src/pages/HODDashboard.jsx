import { useNavigate } from 'react-router-dom'
import kiteLogo from '../assets/logo.png'
import '../styles/hod-dashboard.css'

function HODDashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="hod-dashboard">
      <nav className="hod-navbar">
        <div className="hod-navbar-left">
          <img src={kiteLogo} alt="KITE Logo" className="hod-logo" />
        </div>
        <div className="hod-navbar-right">
          <h1>HOD</h1>
        </div>
      </nav>
      
      <div className="hod-body">
        <div className="hod-main-section">
          {/* Main content area (70%) */}
        </div>
        <div className="hod-side-section">
          {/* Side panel (30%) */}
        </div>
      </div>
    </div>
  )
}

export default HODDashboard
