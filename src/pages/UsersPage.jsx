import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api, withAuditCreate, withAuditSoftDelete, withAuditUpdate } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/Modal'
import { encryptPassword } from '../utils/crypto'
import { validateUser } from '../utils/userValidation'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showInactivosModal, setShowInactivosModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm())
  const [errors, setErrors] = useState({})
  const [inactivos, setInactivos] = useState([])

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const canManageUsers =
    currentUser.rolNombre === 'SUPER_ADMIN' ||
    currentUser.rolPuedeGestionarUsuarios

  if (!canManageUsers) {
    window.alert('No tiene permisos para acceder al módulo de gestión de usuarios.')
    return <Navigate to="/" replace />
  }
  function initialForm() {
    return {
      id: null,
      login: '',
      password: '',
      nombres: '',
      apellidos: '',
      tipoDocumentoId: '',
      numeroDocumento: '',
      genero: '',
      email: '',
      telefono: '',
      rolId: '',
      fechaNacimiento: '',
      fotoUrl: ''
    }
  }

  const loadData = async () => {
    setLoading(true)
    const [usersRes, rolesRes, tiposRes] = await Promise.all([
      api.get('/users', { params: { estado: true } }),
      api.get('/roles', { params: { estado: true } }),
      api.get('/tiposDocumento', { params: { estado: true } })
    ])
    setUsers(usersRes.data || [])
    setRoles(rolesRes.data || [])
    setTiposDocumento(tiposRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    if (roles.length === 0 || tiposDocumento.length === 0) {
      window.alert('Debe crear primero tipos de documento y roles antes de poder crear usuarios.')
      return
    }
    setEditing(null)
    setForm(initialForm())
    setErrors({})
    setShowFormModal(true)
  }

  const handleEdit = (u) => {
    setEditing(u)
    setForm({
      id: u.id,
      login: u.login,
      password: '',
      nombres: u.nombres,
      apellidos: u.apellidos,
      tipoDocumentoId: u.tipoDocumentoId,
      numeroDocumento: u.numeroDocumento,
      genero: u.genero,
      email: u.email,
      telefono: u.telefono,
      rolId: u.rolId,
      fechaNacimiento: u.fechaNacimiento,
      fotoUrl: u.fotoUrl
    })
    setErrors({})
    setShowFormModal(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validateSuperAdminLimit = async (rolId) => {
    const role = roles.find((r) => String(r.id) === String(rolId))
    if (!role || role.nombre !== 'SUPER_ADMIN') return true
    const { data } = await api.get('/users', {
      params: {
        rolNombre: 'SUPER_ADMIN',
        estado: true
      }
    })
    const count = data.length
    const isEditingSameSuperAdmin =
      editing && editing.rolNombre === 'SUPER_ADMIN' && String(editing.rolId) === String(rolId)
    if (count >= 2 && !isEditingSameSuperAdmin) {
      window.alert('Solo se permiten dos usuarios con el rol SUPER_ADMIN.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const vErrors = validateUser(form)
    setErrors(vErrors)
    if (Object.keys(vErrors).length > 0) return

    const role = roles.find((r) => String(r.id) === String(form.rolId))
    const tipoDoc = tiposDocumento.find((t) => String(t.id) === String(form.tipoDocumentoId))

    const baseData = {
      login: form.login.trim(),
      loginLower: form.login.trim().toLowerCase(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      tipoDocumentoId: Number(form.tipoDocumentoId),
      tipoDocumentoCodigo: tipoDoc?.codigo,
      numeroDocumento: form.numeroDocumento.trim(),
      genero: form.genero,
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      rolId: Number(form.rolId),
      rolNombre: role?.nombre,
      rolPuedeGestionarUsuarios: !!role?.puedeGestionarUsuarios,
      fechaNacimiento: form.fechaNacimiento,
      fotoUrl: form.fotoUrl.trim()
    }

    // Verificar duplicados contra usuarios inactivos antes de crear
    if (!editing) {
      const { data: sameLogin } = await api.get('/users', {
        params: { loginLower: baseData.loginLower }
      })

      if (sameLogin && sameLogin.length > 0) {
        const existing = sameLogin[0]
        if (existing.estado === false) {
          const confirmar = window.confirm(
            'Ya existe un usuario inactivo con este login. ¿Desea reactivarlo y actualizar sus datos?'
          )
          if (!confirmar) {
            return
          }
          const payload = withAuditUpdate(existing, {
            ...baseData,
            estado: true,
            deletedAt: null,
            deletedBy: null
          }, currentUser)
          await api.put(`/users/${existing.id}`, payload)
          setShowFormModal(false)
          await loadData()
          return
        } else {
          window.alert('Ya existe un usuario activo con este login.')
          return
        }
      }
    }

    const superAdminOk = await validateSuperAdminLimit(form.rolId)
    if (!superAdminOk) return

    if (!editing) {
      if (form.password) {
        baseData.passwordEncrypted = encryptPassword(form.password)
      }
      const payload = withAuditCreate(baseData, currentUser)
      await api.post('/users', payload)
    } else {
      if (form.password) {
        baseData.passwordEncrypted = encryptPassword(form.password)
      }
      const payload = withAuditUpdate(editing, baseData, currentUser)
      await api.put(`/users/${editing.id}`, payload)
    }

    setShowFormModal(false)
    await loadData()
  }

  const handleDelete = async (u) => {
    if (!window.confirm('¿Seguro que desea inactivar este usuario?')) return
    const payload = withAuditSoftDelete(u, currentUser)
    await api.put(`/users/${u.id}`, payload)
    await loadData()
  }

  const loadInactivos = async () => {
    const { data } = await api.get('/users', { params: { estado: false } })
    setInactivos(data || [])
  }

  const handleOpenInactivos = async () => {
    await loadInactivos()
    setShowInactivosModal(true)
  }

  const handleReactivar = async (u) => {
    const payload = {
      ...u,
      estado: true,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.login || 'system',
      deletedAt: null,
      deletedBy: null
    }
    await api.put(`/users/${u.id}`, payload)
    await loadInactivos()
    await loadData()
  }

  if (loading) {
    return <p>Cargando usuarios...</p>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2>Gestión de usuarios</h2>
        <div>
          <button className="btn btn-secondary" onClick={handleOpenInactivos}>
            Ver usuarios inactivos
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginLeft: '0.5rem' }}>
            Nuevo usuario
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Login</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Tipo doc.</th>
              <th>Número doc.</th>
              <th>Género</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Fecha nac.</th>
              <th>Foto (URL)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.login}</td>
                <td>{u.nombres}</td>
                <td>{u.apellidos}</td>
                <td>{u.tipoDocumentoCodigo}</td>
                <td>{u.numeroDocumento}</td>
                <td>{u.genero}</td>
                <td>{u.email}</td>
                <td>{u.telefono}</td>
                <td>{u.rolNombre}</td>
                <td>{u.fechaNacimiento}</td>
                <td>{u.fotoUrl}</td>
                <td>
                  <span className="badge badge-success">Activo</span>
                </td>
                <td>
                  <button className="btn btn-secondary" onClick={() => handleEdit(u)}>Editar</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(u)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={13}>No hay usuarios activos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <Modal
          title={editing ? 'Editar usuario' : 'Nuevo usuario'}
          onClose={() => setShowFormModal(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Login *</label>
              <input
                name="login"
                className="form-input"
                maxLength={40}
                value={form.login}
                onChange={handleChange}
              />
              {errors.login && <p className="form-error">{errors.login}</p>}
            </div>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  maxLength={200}
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
            )}
            {editing && (
              <div className="form-group">
                <label className="form-label">Nuevo password (opcional)</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  maxLength={200}
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Nombres *</label>
              <input
                name="nombres"
                className="form-input"
                value={form.nombres}
                onChange={handleChange}
              />
              {errors.nombres && <p className="form-error">{errors.nombres}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos *</label>
              <input
                name="apellidos"
                className="form-input"
                value={form.apellidos}
                onChange={handleChange}
              />
              {errors.apellidos && <p className="form-error">{errors.apellidos}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de documento *</label>
              <select
                name="tipoDocumentoId"
                className="form-select"
                value={form.tipoDocumentoId}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                {tiposDocumento.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.codigo} - {t.nombre}
                  </option>
                ))}
              </select>
              {errors.tipoDocumentoId && <p className="form-error">{errors.tipoDocumentoId}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Número de documento *</label>
              <input
                name="numeroDocumento"
                className="form-input"
                value={form.numeroDocumento}
                onChange={handleChange}
              />
              {errors.numeroDocumento && <p className="form-error">{errors.numeroDocumento}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Género *</label>
              <select
                name="genero"
                className="form-select"
                value={form.genero}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
              {errors.genero && <p className="form-error">{errors.genero}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico *</label>
              <input
                name="email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono móvil *</label>
              <input
                name="telefono"
                className="form-input"
                value={form.telefono}
                onChange={handleChange}
              />
              {errors.telefono && <p className="form-error">{errors.telefono}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Rol *</label>
              <select
                name="rolId"
                className="form-select"
                value={form.rolId}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              {errors.rolId && <p className="form-error">{errors.rolId}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de nacimiento *</label>
              <input
                type="date"
                name="fechaNacimiento"
                className="form-input"
                value={form.fechaNacimiento}
                onChange={handleChange}
              />
              {errors.fechaNacimiento && <p className="form-error">{errors.fechaNacimiento}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">URL de la foto *</label>
              <input
                name="fotoUrl"
                className="form-input"
                value={form.fotoUrl}
                onChange={handleChange}
              />
              {errors.fotoUrl && <p className="form-error">{errors.fotoUrl}</p>}
            </div>

            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </form>
        </Modal>
      )}

      {showInactivosModal && (
        <Modal title="Usuarios inactivos" onClose={() => setShowInactivosModal(false)}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Login</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Tipo doc.</th>
                  <th>Número doc.</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map((u) => (
                  <tr key={u.id}>
                    <td>{u.login}</td>
                    <td>{u.nombres}</td>
                    <td>{u.apellidos}</td>
                    <td>{u.tipoDocumentoCodigo}</td>
                    <td>{u.numeroDocumento}</td>
                    <td>{u.email}</td>
                    <td>{u.rolNombre}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleReactivar(u)}>
                        Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
                {inactivos.length === 0 && (
                  <tr>
                    <td colSpan={8}>No hay usuarios inactivos.</td>
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