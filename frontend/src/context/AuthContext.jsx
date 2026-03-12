import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { id, email, name, role, department_id, department_name }
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)  // true while restoring session

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cas_token')
    const savedUser = localStorage.getItem('cas_user')
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('cas_token')
        localStorage.removeItem('cas_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (tokenValue, userData) => {
    setToken(tokenValue)
    setUser(userData)
    localStorage.setItem('cas_token', tokenValue)
    localStorage.setItem('cas_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('cas_token')
    localStorage.removeItem('cas_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
