# Dicasa Backend

Backend de Dicasa, un sistema para la gestión de propiedades inmobiliarias. Construido con [NestJS](https://nestjs.com/), un framework progresivo de Node.js para construir aplicaciones eficientes y escalables del lado del servidor.

## Descripción

Este proyecto proporciona la API REST para la aplicación Dicasa. Gestiona usuarios, autenticación, propiedades y almacenamiento de archivos.

## Características

- **Autenticación de usuarios:** Registro, inicio de sesión y gestión de sesiones con JWT.
- **Gestión de usuarios:** Creación, actualización y eliminación de usuarios.
- **Gestión de propiedades:** Creación, actualización y eliminación de propiedades.
- **Almacenamiento de archivos:** Sube y gestiona archivos en Cloudflare R2.
- **Envío de correos electrónicos:** Envía correos electrónicos para confirmación de cuenta y restablecimiento de contraseña.

## Prerrequisitos

- [Bun](https://bun.sh/)

## Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/dicasa-backend.git
   cd dicasa-backend
   ```

2. Instala las dependencias con Bun:

   ```bash
   bun install
   ```

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables de entorno. Puedes usar el archivo `.env.template` como guía.

```bash
DATABASE_URI=
R2_PUBLIC_URL=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ACCESS_KEY_ID=
CLOUDFLARE_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRATION=
JWT_CONFIRM_SECRET=
JWT_CONFIRM_EXPIRATION=
MAIL_HOST=
MAIL_USER=
MAIL_PASS=
MAIL_PORT=
API_URL=
FRONTEND_URL=
```

## Ejecutando la Aplicación

### Desarrollo

```bash
bun run start
```

### Modo Observador (Watch Mode)

```bash
bun run start:dev
```

### Producción

```bash
bun run start:prod
```

## Ejecutando con Docker

1. Construye la imagen de Docker:

   ```bash
   docker build -t dicasa-backend .
   ```

2. Ejecuta el contenedor:

   ```bash
   docker run -p 3000:3000 --env-file .env dicasa-backend
   ```

## Pruebas

### Pruebas Unitarias

```bash
bun run test
```

### Pruebas End-to-End (e2e)

```bash
bun run test:e2e
```

### Cobertura de Pruebas

```bash
bun run test:cov
```

## Estructura del Proyecto

El proyecto sigue la estructura estándar de una aplicación NestJS:

```
src
├── app.module.ts
├── main.ts
├── auth
├── mail
├── properties
├── storage
└── users
```

- `src/main.ts`: El punto de entrada de la aplicación.
- `src/app.module.ts`: El módulo raíz de la aplicación.
- `src/auth`: Módulo de autenticación.
- `src/mail`: Módulo para el envío de correos.
- `src/properties`: Módulo para la gestión de propiedades.
- `src/storage`: Módulo para el almacenamiento de archivos.
- `src/users`: Módulo para la gestión de usuarios.