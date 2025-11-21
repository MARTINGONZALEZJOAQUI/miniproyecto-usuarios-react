import React from 'react'
import { Outlet } from 'react-router-dom'
import { MenuBar } from './MenuBar'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">Módulo de Usuarios - Miniproyecto</div>
        {user && (
          <div className="app-user-info">
            {user.nombres} {user.apellidos} ({user.rolNombre}){' '}
            <button className="btn btn-secondary" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      <MenuBar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}