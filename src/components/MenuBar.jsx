import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function MenuBar() {
  const { user } = useAuth()

  if (!user) return null

  const canManageUsers = user.rolPuedeGestionarUsuarios || user.rolNombre === 'SUPER_ADMIN'

  return (
    <nav className="menu-bar">
      <NavLink to="/" className={({ isActive }) => 'menu-link' + (isActive ? ' active' : '')}>
        Sistema
      </NavLink>
      <NavLink to="/tipos-documento" className={({ isActive }) => 'menu-link' + (isActive ? ' active' : '')}>
        Tipos de documento
      </NavLink>
      <NavLink to="/roles" className={({ isActive }) => 'menu-link' + (isActive ? ' active' : '')}>
        Roles
      </NavLink>
      {canManageUsers && (
        <NavLink to="/usuarios" className={({ isActive }) => 'menu-link' + (isActive ? ' active' : '')}>
          Usuarios
        </NavLink>
      )}
      
    </nav>
  ) 
}