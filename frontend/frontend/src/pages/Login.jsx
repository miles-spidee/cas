import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/global.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('hod')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // TODO: Add authentication logic
    const dashboard = role === 'hod' ? '/hod-dashboard' : '/staff-dashboard'
    navigate(dashboard)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>College Attendance System</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Login as:</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="staff">Staff</option>
              <option value="hod">HOD</option>
            </select>
          </div>

          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  )
}

export default Login
