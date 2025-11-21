import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.login || !form.password) {
      setError('Debe digitar login y contraseña')
      return
    }
    if (form.login.length > 40) {
      setError('El login no puede superar 40 caracteres')
      return
    }
    if (form.password.length > 200) {
      setError('El password no puede superar 200 caracteres')
      return
    }

    try {
      await login(form.login, form.password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h2>Ingreso al sistema</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login">Login</label>
            <input
              id="login"
              name="login"
              className="form-input"
              maxLength={40}
              value={form.login}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              maxLength={200}
              value={form.password}
              onChange={handleChange}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}