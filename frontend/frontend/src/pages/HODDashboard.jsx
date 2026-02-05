import { useNavigate } from 'react-router-dom'

function HODDashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h2>HOD Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>
      <main className="dashboard-content">
        <h1>Welcome to HOD Dashboard</h1>
        <p>Department attendance and staff management tools will be displayed here.</p>
      </main>
    </div>
  )
}

export default HODDashboard
