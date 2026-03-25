import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginAPI } from '../services/api'
import logo from '../assets/logo.png'
import ipsLogo from '../assets/ips-logo.png'
import '../styles/global.css'

const TIMETABLE_ONLY_EMAIL = 'shanmugasundaram@college.edu'
const TIMETABLE_ONLY_PASSWORD = '123123'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const normalizedEmail = email.trim().toLowerCase()
    const isTimetableOnlyUser =
      normalizedEmail === TIMETABLE_ONLY_EMAIL && password === TIMETABLE_ONLY_PASSWORD

    try {
      const data = await loginAPI(email, password, {
        portal: isTimetableOnlyUser ? 'timetable' : 'hod',
      })
      login(data.token, data.user)
      if (isTimetableOnlyUser) {
        navigate('/timetable')
      } else {
        navigate('/hod')
      }
    } catch (err) {
      // Parse error message from API response
      let message = err.message
      try {
        const parsed = JSON.parse(message.replace(/^\d+\s*/, ''))
        message = parsed.error || message
      } catch {
        // keep original
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo-wrapper">
          <img src={logo} alt="KITE Logo" className="login-card__logo" />
        </div>
        <h1 className="login-card__title">CLASS ALTER SYSTEM</h1>
        <p className="login-card__subtitle">HOD Login</p>

        {error && (
          <div className="login-error">{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="you@kgkite.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <img src={ipsLogo} alt="IPS Tech Community" className="login-footer__logo" />
        <span className="login-footer__text">powered by IPS Tech Community</span>
      </footer>
    </div>
  )
}

export default Login
