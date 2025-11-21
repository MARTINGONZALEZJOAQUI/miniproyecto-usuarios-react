import CryptoJS from 'crypto-js'


const SECRET_KEY = 'miniproyecto-usuarios-32bytes-key-123456'

export function encryptPassword(plainPassword) {
  if (!plainPassword) return ''

  return CryptoJS.SHA256(plainPassword + SECRET_KEY).toString()
}

export function verifyPassword(plainPassword, cipherText) {
  if (!plainPassword || !cipherText) return false
  const expected = encryptPassword(plainPassword)
  return expected === cipherText
}