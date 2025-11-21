import React, { useEffect, useState } from 'react'
import { api, withAuditCreate, withAuditSoftDelete, withAuditUpdate } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/Modal'

export function RolesPage() {
  const { user: currentUser } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showInactivosModal, setShowInactivosModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ id: null, nombre: '', descripcion: '', puedeGestionarUsuarios: false })
  const [errors, setErrors] = useState({})
  const [inactivos, setInactivos] = useState([])

  const loadRoles = async () => {
    setLoading(true)
    const { data } = await api.get('/roles', { params: { estado: true } })
    setRoles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ id: null, nombre: '', descripcion: '', puedeGestionarUsuarios: false })
    setErrors({})
    setShowFormModal(true)
  }

  const handleEdit = (r) => {
    setEditing(r)
    setForm({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion || '',
      puedeGestionarUsuarios: !!r.puedeGestionarUsuarios
    })
    setErrors({})
    setShowFormModal(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validate = () => {
    const e = {}
    if (!form.nombre?.trim()) e.nombre = 'El nombre es obligatorio'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    const base = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      puedeGestionarUsuarios: !!form.puedeGestionarUsuarios
    }

    // Nuevo rol: mirar duplicado inactivo
    if (!editing) {
      const { data: sameName } = await api.get('/roles', {
        params: { nombre: base.nombre }
      })
      if (sameName && sameName.length > 0) {
        const existing = sameName[0]
        if (existing.estado === false) {
          const confirmar = window.confirm(
            'Ya existe un rol inactivo con este nombre. ¿Desea reactivarlo y actualizar sus datos?'
          )
          if (!confirmar) {
            return
          }
          const payload = withAuditUpdate(existing, {
            ...base,
            estado: true,
            deletedAt: null,
            deletedBy: null
          }, currentUser)
          await api.put(`/roles/${existing.id}`, payload)
          setShowFormModal(false)
          await loadRoles()
          return
        } else {
          window.alert('Ya existe un rol activo con este nombre.')
          return
        }
      }
    }

    if (!editing) {
      const payload = withAuditCreate(base, currentUser)
      await api.post('/roles', payload)
    } else {
      if (editing.nombre === 'SUPER_ADMIN' && form.nombre.trim() !== 'SUPER_ADMIN') {
        window.alert('No se puede cambiar el nombre del rol SUPER_ADMIN.')
        return
      }
      const payload = withAuditUpdate(editing, base, currentUser)
      await api.put(`/roles/${editing.id}`, payload)
    }

    setShowFormModal(false)
    await loadRoles()
  }

  const handleDelete = async (r) => {
    if (r.nombre === 'SUPER_ADMIN') {
      window.alert('No se puede inactivar el rol SUPER_ADMIN.')
      return
    }
    if (!window.confirm('¿Seguro que desea inactivar este rol?')) return
    const payload = withAuditSoftDelete(r, currentUser)
    await api.put(`/roles/${r.id}`, payload)
    await loadRoles()
  }

  const loadInactivos = async () => {
    const { data } = await api.get('/roles', { params: { estado: false } })
    setInactivos(data || [])
  }

  const handleOpenInactivos = async () => {
    await loadInactivos()
    setShowInactivosModal(true)
  }

  const handleReactivar = async (r) => {
    const payload = {
      ...r,
      estado: true,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.login || 'system',
      deletedAt: null,
      deletedBy: null
    }
    await api.put(`/roles/${r.id}`, payload)
    await loadInactivos()
    await loadRoles()
  }

  if (loading) {
    return <p>Cargando roles...</p>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2>Gestión de roles</h2>
        <div>
          <button className="btn btn-secondary" onClick={handleOpenInactivos}>
            Ver roles inactivos
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginLeft: '0.5rem' }}>
            Nuevo rol
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Puede gestionar usuarios</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td>{r.descripcion}</td>
                <td>{r.puedeGestionarUsuarios ? 'Sí' : 'No'}</td>
                <td>
                  <span className="badge badge-success">Activo</span>
                </td>
                <td>
                  <button className="btn btn-secondary" onClick={() => handleEdit(r)}>Editar</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(r)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={5}>No hay roles activos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <Modal title={editing ? 'Editar rol' : 'Nuevo rol'} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                name="nombre"
                className="form-input"
                value={form.nombre}
                onChange={handleChange}
              />
              {errors.nombre && <p className="form-error">{errors.nombre}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input
                name="descripcion"
                className="form-input"
                value={form.descripcion}
                onChange={handleChange}
              />
            </div>
            
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </form>
        </Modal>
      )}

      {showInactivosModal && (
        <Modal title="Roles inactivos" onClose={() => setShowInactivosModal(false)}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nombre}</td>
                    <td>{r.descripcion}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleReactivar(r)}>
                        Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
                {inactivos.length === 0 && (
                  <tr>
                    <td colSpan={3}>No hay roles inactivos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}