import React from 'react'

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}