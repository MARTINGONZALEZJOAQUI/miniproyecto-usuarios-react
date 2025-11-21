import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../utils/api'
import { verifyPassword } from '../utils/crypto'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = window.localStorage.getItem('currentUser')
    if (saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const login = async (loginInput, password) => {
    const loginLower = loginInput.trim().toLowerCase()
    const { data } = await api.get('/users', {
      params: {
        loginLower
      }
    })
    if (!data || data.length === 0) {
      throw new Error('Usuario o contraseña inválidos')
    }
    const found = data[0]
    const ok = verifyPassword(password, found.passwordEncrypted)
    if (!ok) {
      throw new Error('Usuario o contraseña inválidos')
    }
    if (!found.estado) {
      throw new Error('El usuario está inactivo')
    }
    window.localStorage.setItem('currentUser', JSON.stringify(found))
    setUser(found)
    return found
  }

  const logout = () => {
    window.localStorage.removeItem('currentUser')
    setUser(null)
  }

  const value = { user, loading, login, logout }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}