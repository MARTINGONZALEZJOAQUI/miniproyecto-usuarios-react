# Miniproyecto de gestión de usuarios, roles y tipos de documento

Este proyecto es una aplicación de tipo SPA desarrollada en React que utiliza json-server como backend simulado.  
Permite gestionar usuarios, roles y tipos de documento, con eliminación lógica, reactivación de elementos inactivos y control de acceso por rol, de acuerdo con los requisitos del miniproyecto.



---

## 1. Requisitos previos para ejecutar la aplicación

Antes de clonar el repositorio y correr la aplicación, se necesitan estos recursos instalados en el equipo:

- Node.js (se recomienda la versión LTS)
- npm (se instala junto con Node.js)
- Git

Se pueden verificar las versiones con:

```bash
node -v
npm -v
git --version
```

---

## 2. Clonación del repositorio

Para obtener el código fuente desde GitHub se ejecutan estos comandos:

```bash
git clone https://github.com/MARTINGONZALEZJOAQUI/miniproyecto-usuarios-react.git
cd miniproyecto-usuarios-react
```

Después de esto se debe estar ubicado dentro de la carpeta del proyecto para instalar dependencias y ejecutar la aplicación.

---

## 3. Instalación de dependencias

Dentro de la carpeta del proyecto se instalan las dependencias del frontend y del backend simulado con:

```bash
npm install
```

Este comando descarga todas las librerías necesarias, incluyendo React, React Router y json-server.

---

## 4. Ejecución del backend con json-server

El backend del miniproyecto se implementa con json-server utilizando el archivo `db.json` como base de datos en memoria.

Para iniciar el backend se usa:

```bash
npm run json-server
```

Por defecto el backend quedará expuesto en `http://localhost:3000` y publicará los siguientes recursos principales:

- `http://localhost:3000/users`
- `http://localhost:3000/roles`
- `http://localhost:3000/tiposDocumento`

Estos endpoints son usados por la aplicación React para realizar las operaciones de gestión.

---

## 5. Ejecución del frontend con React

En otra terminal, dentro de la misma carpeta del proyecto, se ejecuta el servidor de desarrollo del frontend:

```bash
npm run dev
```

Vite mostrará una URL similar a:

```text
http://localhost:5173
```

Esa URL se abre en el navegador para usar la aplicación.

---

## 6. Inicio de sesión y control de acceso

El sistema controla el acceso a las interfaces internas mediante autenticación.  
No es posible entrar a los módulos internos sólo escribiendo la URL si el usuario no está autenticado.

Existen usuarios de prueba con el rol `SUPER_ADMIN`, por ejemplo:

- Login: `admin1`  
- Password: `Admin123*`

Después de autenticarse con este usuario se puede acceder a los módulos de gestión de:

- Tipos de documento
- Roles
- Usuarios

El módulo de gestión de usuarios sólo es accesible para:

- El rol `SUPER_ADMIN`

De esta forma se cumple el requisito de controlar el acceso a las interfaces y de restringir el módulo de usuarios para los roles que no tengan ese permiso.

---

## 7. Descripción general de funcionalidades implementadas

La aplicación implementa los siguientes puntos clave del miniproyecto:

- Gestión completa de tipos de documento, roles y usuarios:
  - Crear
  - Modificar
  - Inactivar (eliminación lógica)
  - Consultar

- Los tipos de documento manejan sólo los campos:
  - Código
  - Nombre o descripción  
  Además se registran automáticamente:
  - Fecha y hora de creación, modificación e inactivación
  - Usuario que realiza cada operación

- La eliminación de elementos no borra los registros físicamente.  
  Se utiliza un campo booleano `estado` para marcar los elementos como activos o inactivos.

- Si se intenta crear un elemento que coincide con uno inactivo:
  - La aplicación notifica al usuario que el dato ya existe
  - Pregunta si se desea reactivarlo y actualizar la información

- La modificación y la eliminación sólo son posibles sobre elementos activos.

- En las tablas principales sólo se muestran elementos activos.  
  Existen interfaces adicionales (ventanas modales) para ver y reactivar elementos inactivos.

- Validaciones de formularios según la definición de los campos:
  - Campos obligatorios
  - Campos numéricos para documento y teléfono
  - Validación de formato de correo electrónico
  - Longitudes máximas de ciertos campos
  - Validación básica de fecha de nacimiento
  - URL obligatoria para la foto de usuario

- Rol inicial de `SUPER_ADMIN` con acceso a todo:
  - Sólo se permiten como máximo dos usuarios con este rol.
  - Si se intenta crear un tercer usuario `SUPER_ADMIN`, la aplicación lo bloquea y muestra un mensaje.

- Los nuevos roles no tienen acceso al módulo de gestión de usuarios por defecto:
  - El acceso a ese módulo se controla con el campo `puedeGestionarUsuarios`el cual no se puede modificar y está fijo para que sólo los super administradores puedan gestionar usuarios.

- La aplicación es de tipo SPA:
  - Todas las interfaces se cargan dentro de una misma aplicación React.
  - Las interfaces auxiliares (creación, edición, inactivos) se manejan mediante ventanas modales.

---

