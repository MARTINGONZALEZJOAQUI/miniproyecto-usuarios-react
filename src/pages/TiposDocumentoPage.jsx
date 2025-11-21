import React, { useEffect, useState } from 'react'
import { api, withAuditCreate, withAuditSoftDelete, withAuditUpdate } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/Modal'

export function TiposDocumentoPage() {
  const { user: currentUser } = useAuth()
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showInactivosModal, setShowInactivosModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ id: null, codigo: '', nombre: '' })
  const [errors, setErrors] = useState({})
  const [inactivos, setInactivos] = useState([])

  const loadTipos = async () => {
    setLoading(true)
    const { data } = await api.get('/tiposDocumento', { params: { estado: true } })
    setTipos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadTipos()
  }, [])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ id: null, codigo: '', nombre: '' })
    setErrors({})
    setShowFormModal(true)
  }

  const handleEdit = (t) => {
    setEditing(t)
    setForm({ id: t.id, codigo: t.codigo, nombre: t.nombre })
    setErrors({})
    setShowFormModal(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const e = {}
    if (!form.codigo?.trim()) e.codigo = 'El código es obligatorio'
    if (!form.nombre?.trim()) e.nombre = 'El nombre es obligatorio'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    const base = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim()
    }

    // Nuevo tipo: revisar duplicado inactivo
    if (!editing) {
      const { data: sameCode } = await api.get('/tiposDocumento', {
        params: { codigo: base.codigo }
      })
      if (sameCode && sameCode.length > 0) {
        const existing = sameCode[0]
        if (existing.estado === false) {
          const confirmar = window.confirm(
            'Ya existe un tipo de documento inactivo con este código. ¿Desea reactivarlo y actualizar sus datos?'
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
          await api.put(`/tiposDocumento/${existing.id}`, payload)
          setShowFormModal(false)
          await loadTipos()
          return
        } else {
          window.alert('Ya existe un tipo de documento activo con este código.')
          return
        }
      }
    }

    if (!editing) {
      const payload = withAuditCreate(base, currentUser)
      await api.post('/tiposDocumento', payload)
    } else {
      const payload = withAuditUpdate(editing, base, currentUser)
      await api.put(`/tiposDocumento/${editing.id}`, payload)
    }

    setShowFormModal(false)
    await loadTipos()
  }

  const handleDelete = async (t) => {
    if (!window.confirm('¿Seguro que desea inactivar este tipo de documento?')) return
    const payload = withAuditSoftDelete(t, currentUser)
    await api.put(`/tiposDocumento/${t.id}`, payload)
    await loadTipos()
  }

  const loadInactivos = async () => {
    const { data } = await api.get('/tiposDocumento', { params: { estado: false } })
    setInactivos(data || [])
  }

  const handleOpenInactivos = async () => {
    await loadInactivos()
    setShowInactivosModal(true)
  }

  const handleReactivar = async (t) => {
    const payload = {
      ...t,
      estado: true,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.login || 'system',
      deletedAt: null,
      deletedBy: null
    }
    await api.put(`/tiposDocumento/${t.id}`, payload)
    await loadInactivos()
    await loadTipos()
  }

  if (loading) {
    return <p>Cargando tipos de documento...</p>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2>Gestión de tipos de documento</h2>
        <div>
          <button className="btn btn-secondary" onClick={handleOpenInactivos}>
            Ver tipos inactivos
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginLeft: '0.5rem' }}>
            Nuevo tipo
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((t) => (
              <tr key={t.id}>
                <td>{t.codigo}</td>
                <td>{t.nombre}</td>
                <td>
                  <span className="badge badge-success">Activo</span>
                </td>
                <td>
                  <button className="btn btn-secondary" onClick={() => handleEdit(t)}>Editar</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(t)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {tipos.length === 0 && (
              <tr>
                <td colSpan={4}>No hay tipos de documento activos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <Modal title={editing ? 'Editar tipo de documento' : 'Nuevo tipo de documento'} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Código *</label>
              <input
                name="codigo"
                className="form-input"
                value={form.codigo}
                onChange={handleChange}
              />
              {errors.codigo && <p className="form-error">{errors.codigo}</p>}
            </div>
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
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </form>
        </Modal>
      )}

      {showInactivosModal && (
        <Modal title="Tipos de documento inactivos" onClose={() => setShowInactivosModal(false)}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map((t) => (
                  <tr key={t.id}>
                    <td>{t.codigo}</td>
                    <td>{t.nombre}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleReactivar(t)}>
                        Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
                {inactivos.length === 0 && (
                  <tr>
                    <td colSpan={3}>No hay tipos de documento inactivos.</td>
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