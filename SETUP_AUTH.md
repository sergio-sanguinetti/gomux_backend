# Configuración de Autenticación

Este documento explica cómo configurar el sistema de autenticación con Prisma y MySQL.

## Requisitos Previos

- Node.js >= 18.0.0
- MySQL instalado y ejecutándose
- Base de datos MySQL creada

## Pasos de Configuración

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```env
# Base de datos MySQL
DATABASE_URL="mysql://usuario:password@localhost:3306/administracion_gomux?schema=public"

# JWT Secret para firmar tokens (cambiar en producción)
JWT_SECRET="tu_secret_key_muy_segura_aqui_cambiar_en_produccion"

# Puerto del servidor
PORT=5000

# URL del frontend para CORS
FRONTEND_URL=http://localhost:3000

# Entorno
NODE_ENV=development
```

**Importante:** 
- Reemplaza `usuario`, `password` y `localhost:3306` con tus credenciales de MySQL
- Reemplaza `administracion_gomux` con el nombre de tu base de datos
- Cambia `JWT_SECRET` por una clave secreta segura en producción

### 2. Crear la Base de Datos

Crea la base de datos en MySQL:

```sql
CREATE DATABASE administracion_gomux CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Ejecutar Migraciones de Prisma

Desde la carpeta `backend`, ejecuta:

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Crear las tablas en la base de datos
npm run prisma:migrate
```

O si prefieres hacer push directo sin migraciones:

```bash
npm run prisma:push
```

### 4. Iniciar el Servidor

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

## Endpoints de Autenticación

### POST `/api/auth/registro`

Registra un nuevo usuario.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123",
  "nombre": "Nombre Usuario",
  "rol": "usuario"
}
```

**Roles disponibles:** `usuario`, `proveedor`, `comprador`, `gestor`, `administrador`, `solicitante`, `cumplimiento`, `cuentas`, `auditor`, `seguridad`

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Nombre Usuario",
      "rol": "usuario",
      "activo": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST `/api/auth/login`

Inicia sesión con un usuario existente.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "usuario": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Nombre Usuario",
      "rol": "usuario"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET `/api/auth/perfil`

Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Nombre Usuario",
      "rol": "usuario",
      "activo": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Modelo de Usuario

El modelo de Usuario en Prisma incluye:

- `id`: Identificador único (auto-incremento)
- `email`: Email único del usuario
- `password`: Contraseña hasheada con bcrypt
- `nombre`: Nombre completo (opcional)
- `rol`: Rol del usuario (default: 'usuario')
- `activo`: Estado del usuario (default: true)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

## Seguridad

- Las contraseñas se hashean con bcrypt (10 salt rounds)
- Los tokens JWT expiran en 24 horas
- Se valida el formato de email
- Se valida la fortaleza de la contraseña (mínimo 6 caracteres, recomendado: mayúscula, minúscula y número)
- Rate limiting configurado (100 requests por 15 minutos)

## Prisma Studio

Para visualizar y editar datos directamente en la base de datos:

```bash
npm run prisma:studio
```

Esto abrirá Prisma Studio en `http://localhost:5555`

