
export function validateUser(form) {
  const errors = {}

  if (!form.login?.trim()) {
    errors.login = 'El login es obligatorio'
  } else if (form.login.length > 40) {
    errors.login = 'Máximo 40 caracteres'
  }

  if (!form.password && !form.id) {
    errors.password = 'Debe definir una contraseña'
  } else if (form.password && form.password.length > 200) {
    errors.password = 'Máximo 200 caracteres'
  }

  if (!form.nombres?.trim()) {
    errors.nombres = 'Los nombres son obligatorios'
  }

  if (!form.apellidos?.trim()) {
    errors.apellidos = 'Los apellidos son obligatorios'
  }

  if (!form.tipoDocumentoId) {
    errors.tipoDocumentoId = 'Seleccione un tipo de documento'
  }

  if (!form.numeroDocumento?.trim()) {
    errors.numeroDocumento = 'El número de documento es obligatorio'
  } else if (!/^\d+$/.test(form.numeroDocumento)) {
    errors.numeroDocumento = 'Solo se permiten dígitos'
  }

  if (!form.genero) {
    errors.genero = 'Seleccione un género'
  }

  if (!form.email?.trim()) {
    errors.email = 'El correo es obligatorio'
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Formato de correo inválido'
  }

  if (!form.telefono?.trim()) {
    errors.telefono = 'El teléfono es obligatorio'
  } else if (!/^\d{7,15}$/.test(form.telefono)) {
    errors.telefono = 'Solo números, entre 7 y 15 dígitos'
  }

  if (!form.rolId) {
    errors.rolId = 'Seleccione un rol'
  }

  if (!form.fechaNacimiento) {
    errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
  } else if (new Date(form.fechaNacimiento) > new Date()) {
    errors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura'
  }

  if (!form.fotoUrl?.trim()) {
    errors.fotoUrl = 'La URL de la foto es obligatoria'
  } else if (!/^https?:\/\/.+/.test(form.fotoUrl)) {
  errors.fotoUrl = 'La URL debe comenzar con http:// o https://'
  }

  return errors
}
