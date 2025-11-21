
# Miniproyecto 1 - Frontend Usuarios (React + json-server)

## Requisitos previos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

En otra terminal, levantar el backend con json-server:

```bash
npm run json-server
```

Esto expone la API REST en `http://localhost:3001` usando el archivo `db.json` como "base de datos".

Luego, levantar el frontend:

```bash
npm run dev
```

Y abrir el navegador en la URL que indique Vite (por defecto `http://localhost:5173`).

## Credenciales iniciales (SUPER_ADMIN)

El archivo `db.json` ya viene con **dos usuarios iniciales** con rol `SUPER_ADMIN`, para cumplir el requisito de máximo dos usuarios con ese rol:

- login: `admin1` / password: `Admin123*`
- login: `admin2` / password: `Admin123*`

La contraseña NO se almacena en texto plano. En el campo `passwordEncrypted` se guarda un **hash SHA-256** calculado con la librería `crypto-js` y una clave secreta, y el login compara contra ese hash para validar las credenciales.
