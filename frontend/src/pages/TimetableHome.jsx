import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Departments from './timetable/Departments'
import Classes from './timetable/Classes'
import TimetableBoard from './timetable/TimetableBoard'
import '../styles/timetable.css'

function TimetableHome() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [department, setDepartment] = useState(null)
  const [className, setClassName] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="tt-layout">
      <div className="tt-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#1a1a2e' }}>Timetable Manager</h1>
          <button className="tt-mini-btn" onClick={handleLogout}>Logout</button>
        </div>

        {!department && <Departments setDepartment={setDepartment} />}

        {department && !className && (
          <Classes
            department={department}
            setClassName={setClassName}
            onBack={() => setDepartment(null)}
          />
        )}

        {department && className && (
          <TimetableBoard className={className} onBack={() => setClassName(null)} />
        )}
      </div>
    </div>
  )
}

export default TimetableHome
