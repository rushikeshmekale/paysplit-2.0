import { createContext, useState, useEffect, useContext } from 'react'
import { authLogin, authLogout, authRegister, getMe } from '../lib/api'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)   // null=loading, false=logged out
  const [loading, setLoading] = useState(true)

  // On mount — restore session from stored JWT
  useEffect(() => {
    const token = localStorage.getItem('paysplit_token')
    if (!token) { setUser(false); setLoading(false); return }
    getMe()
      .then((data) => setUser(data))
      .catch(() => { localStorage.removeItem('paysplit_token'); setUser(false) })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await authLogin(email, password)
    setUser(data.user)
    return data
  }

  const register = async (email, password, name) => {
    const data = await authRegister(email, password, name)
    setUser(data.user)
    return data
  }

  const logout = () => {
    authLogout()
    setUser(false)
  }

  const updateUser = (patch) => {
  setUser(prev => ({ ...prev, ...patch }))
}

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout,  updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
