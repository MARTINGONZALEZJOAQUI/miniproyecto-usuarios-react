import React from 'react'
import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="card">
      <h2>Bienvenido</h2>
      <p>
        Hola {user?.nombres}, este es el panel principal del sistema. Desde el menú superior puedes
        acceder a la gestión de tipos de documento, roles y usuarios(si eres Super Administrador).
      </p>
    </div>
  )
}