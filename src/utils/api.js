import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3001'
})

// Helpers para auditoría
export function withAuditCreate(data, currentUser) {
  return {
    ...data,
    estado: true,
    createdAt: new Date().toISOString(),
    createdBy: currentUser?.login || 'system'
  }
}

export function withAuditUpdate(previous, data, currentUser) {
  return {
    ...previous,
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser?.login || 'system'
  }
}

export function withAuditSoftDelete(previous, currentUser) {
  return {
    ...previous,
    estado: false,
    deletedAt: new Date().toISOString(),
    deletedBy: currentUser?.login || 'system'
  }
}