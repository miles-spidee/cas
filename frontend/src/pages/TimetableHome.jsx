import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Departments from './timetable/Departments'
import Classes from './timetable/Classes'
import TimetableBoard from './timetable/TimetableBoard'
import logo from '../assets/logo.png'
import ipsLogo from '../assets/ips-logo.png'
import '../styles/timetable.css'

function TimetableHome() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [department, setDepartment] = useState(null)
  const [className, setClassName] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="tt-layout">
      <header className="tt-shell-header">
        <div className="tt-shell-header__left">
          <img src={logo} alt="KITE Logo" className="tt-shell-header__logo" />
        </div>
        <div className="tt-shell-header__right">
          <span className="tt-shell-header__user">{user?.name}</span>
          <span className="tt-shell-header__dept">{user?.department_name} - HOD</span>
          <button className="tt-shell-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="tt-info-bar">
        <span className="tt-info-bar__title">Timetable Manager</span>
      </div>

      <div className="tt-main">
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

      <footer className="tt-footer">
        <img src={ipsLogo} alt="IPS Tech Community" className="tt-footer__logo" />
        <span className="tt-footer__text">powered by IPS Tech Community</span>
      </footer>
    </div>
  )
}

export default TimetableHome
