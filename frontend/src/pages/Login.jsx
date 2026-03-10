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
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-card__title">Class Alter System</h1>
        <p className="login-card__subtitle">Sign in to continue</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Login as</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="staff">Staff</option>
              <option value="hod">HOD</option>
            </select>
          </div>

          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </div>
    </div>
  )
}

export default Login
