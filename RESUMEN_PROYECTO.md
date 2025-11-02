# Resumen del Proyecto: Dicasa Backend

Este documento proporciona un resumen técnico del backend del proyecto Dicasa, una aplicación NestJS para la gestión inmobiliaria.

## Tecnologías Principales

- **Framework:** NestJS
- **Lenguaje:** TypeScript
- **Base de Datos:** MongoDB con Mongoose
- **Autenticación:** JWT (JSON Web Tokens) con Argon2 para hashing de contraseñas.
- **Manejo de Paquetes:** Bun
- **Contenerización:** Docker
- **Almacenamiento de Archivos:** Cloudflare R2
- **Envío de Correos:** Nodemailer con plantillas Handlebars.

---

## Estructura y Módulos del Proyecto

El backend está organizado en módulos funcionales, cada uno con su propio controlador (para manejar las rutas HTTP) y servicio (para la lógica de negocio).

### Módulo Principal (`AppModule`)

Es el módulo raíz que importa y ensambla todos los demás módulos del proyecto.

- **Archivo:** `src/app.module.ts`
- **Módulos Importados:**
  - `AuthModule`: Para autenticación y gestión de usuarios.
  - `UsersModule`: Para operaciones CRUD de usuarios.
  - `PropertiesModule`: Para la gestión de propiedades.
  - `AppointmentsModule`: Para gestionar citas y solicitudes de información.
  - `LocationModule`: Para obtener datos de ubicación (estados/ciudades).
  - `MailModule`: Servicio de envío de correos.
  - `StorageModule`: Para la subida y eliminación de archivos en Cloudflare R2.
  - `ConfigModule`: Para la gestión de variables de entorno.
  - `MongooseModule`: Para la conexión con MongoDB.
  - `ScheduleModule`: Para tareas programadas (cron jobs).

---

### 1. Módulo `auth`

Gestiona el registro, inicio de sesión y recuperación de contraseñas.

#### `auth.controller.ts`

- **Ruta Base:** `/auth`
- **Métodos:**
  - `POST /login`: Inicia sesión de un usuario.
  - `POST /register`: Registra un nuevo usuario y envía un correo de confirmación.
  - `GET /checkToken`: Renueva y devuelve un token JWT si el token actual es válido.
  - `GET /confirm-email`: Confirma el correo de un usuario a través de un token.
  - `POST /resend-confirmation`: Reenvía el correo de confirmación.
  - `POST /forgot-password`: Inicia el proceso de recuperación de contraseña.
  - `POST /verify-reset-code`: Verifica el código de reseteo de contraseña.
  - `POST /reset-password`: Restablece la contraseña del usuario.
  - `POST /change-password`: Permite a un usuario autenticado cambiar su contraseña.

#### `auth.service.ts`

- **Lógica:**
  - `register()`: Crea un nuevo usuario y llama a `sendConfirmationEmail`.
  - `login()`: Valida las credenciales y genera un token JWT.
  - `checkToken()`: Genera un nuevo token para un usuario ya validado.
  - `confirmEmail()`: Valida el token de confirmación y marca el email del usuario como verificado.
  - `sendPasswordResetEmail()`: Genera un código de reseteo y lo envía por correo.
  - `verifyResetCode()`: Compara el código proporcionado con el hash almacenado.
  - `resetPassword()`: Actualiza la contraseña del usuario.
  - `changePassword()`: Cambia la contraseña verificando la antigua.

---

### 2. Módulo `users`

Maneja las operaciones CRUD para los usuarios.

#### `users.controller.ts`

- **Ruta Base:** `/users`
- **Métodos:**
  - `POST /create`: (Superadmin/Admin) Crea un nuevo usuario (generalmente agentes).
  - `PUT /me/picture`: Permite a un usuario subir/actualizar su foto de perfil.
  - `GET /`: (Superadmin/Admin) Obtiene una lista de todos los usuarios.
  - `GET /:id`: (Superadmin/Admin) Obtiene un usuario por su ID.
  - `PATCH /me`: Permite a un usuario actualizar su propia información (nombre, teléfono).
  - `PATCH /superadmin/:id`: (Superadmin) Actualiza la información de cualquier usuario.
  - `DELETE /superadmin/:id`: (Superadmin) Elimina un usuario.

#### `users.service.ts`

- **Lógica:**
  - `create()`: Crea un nuevo usuario en la base de datos.
  - `findAll()`: Devuelve todos los usuarios.
  - `findOneByEmail()` / `findOneById()`: Busca usuarios por email o ID.
  - `updateMyInfo()` / `updateUser()`: Actualiza los datos de un usuario.
  - `remove()`: Elimina un usuario de la base de datos.
  - `updateProfilePicture()`: Sube una imagen a R2 y actualiza la URL en el perfil del usuario.
  - `handleUnverifiedUserCleanup()`: Tarea programada (cron job) que elimina usuarios no verificados después de 7 días.

---

### 3. Módulo `properties`

Gestiona todo lo relacionado con las propiedades inmobiliarias.

#### `properties.controller.ts`

- **Ruta Base:** `/properties`
- **Métodos:**
  - `POST /`: (Superadmin/Admin) Crea una nueva propiedad.
  - `POST /upload`: (Superadmin/Admin) Sube imágenes para una propiedad.
  - `GET /`: (Público) Obtiene una lista de todas las propiedades con filtros y paginación.
  - `GET /agent/my-properties`: (Admin/Superadmin) Obtiene las propiedades del agente autenticado.
  - `GET /:id`: (Público) Obtiene los detalles de una propiedad por su ID.
  - `PATCH /:id`: (Superadmin/Admin) Actualiza una propiedad.
  - `DELETE /:id`: (Superadmin/Admin) Elimina una propiedad y sus imágenes asociadas.

#### `properties.service.ts`

- **Lógica:**
  - `create()`: Guarda una nueva propiedad en la base de datos, asociándola a un agente.
  - `uploadImages()`: Sube múltiples archivos a Cloudflare R2 y devuelve las URLs.
  - `findAll()`: Devuelve una lista paginada y filtrada de propiedades. Admite filtros por:
    - `search`: Búsqueda de texto completo.
    - `featured`: Propiedades destacadas.
    - `state` y `city`: Ubicación.
    - `type`: Tipo de propiedad (casa, apartamento, etc.).
    - `status`: Estado de la propiedad (en venta, en alquiler).
    - `minPrice` y `maxPrice`: Rango de precios.
    - `bedrooms`: Número de habitaciones.
  - `findOne()`: Busca una propiedad por su ID.
  - `update()`: Actualiza los datos de una propiedad.
  - `remove()`: Elimina la propiedad y llama a `storageService` para borrar las imágenes.
  - `validateLocation()`: Valida que el estado y la ciudad de la dirección existan.
  - `invalidatePropertiesCache()`: Invalida el caché de Redis/Valkey cuando se crea, actualiza o elimina una propiedad.

---

### 4. Módulo `appointments`

Gestiona las citas y solicitudes de información de los clientes.

#### `appointments.controller.ts`

- **Ruta Base:** `/appointments`
- **Métodos:**
  - `POST /`: (Público) Crea una nueva solicitud de cita.
  - `GET /`: (Superadmin/Admin) Obtiene todas las citas.
  - `GET /me`: (Autenticado) Obtiene las citas del usuario autenticado.
  - `GET /:id`: (Superadmin/Admin) Obtiene una cita por ID.
  - `PATCH /:id`: Actualiza el estado o fecha de una cita.
  - `PATCH /:id/reassign-agent`: (Superadmin) Reasigna una cita a un nuevo agente.
  - `DELETE /:id`: Elimina una cita.

#### `appointments.service.ts`

- **Lógica:**
  - `create()`:
    - Valida que la propiedad exista y tenga un agente.
    - Verifica que el agente no tenga otra cita en un rango de +/- 1 hora.
    - Guarda la cita en la base de datos.
    - Envía un correo de notificación al agente y uno de confirmación al cliente.
  - `findAll()`: Devuelve todas las citas.
  - `findOne()`: Busca una cita por su ID.
  - `findForUser()`: Busca las citas de un usuario por su email o número de teléfono.
  - `update()`: Actualiza una cita, validando conflictos de horario si la fecha cambia.
  - `reassignAgent()`: Cambia el agente de una cita, validando que el nuevo agente no tenga conflictos de horario.
  - `remove()`: Elimina una cita.

---

### 5. Módulos de Soporte

#### `location.module.ts`

- **Función:** Provee datos geográficos de Venezuela.
- **Controlador:** `location.controller.ts`
  - `GET /location/states`: Devuelve una lista de todos los estados.
  - `GET /location/cities/:stateName`: Devuelve las ciudades/municipios de un estado específico.
- **Servicio:** `location.service.ts`
  - Lee los datos del archivo `src/data/venezuela.json`.

#### `mail.module.ts`

- **Función:** Servicio centralizado para el envío de correos transaccionales.
- **Servicio:** `mail.service.ts`
  - `sendEmail()`: Método genérico que utiliza `MailerService` para enviar un correo usando una plantilla Handlebars (`.hbs`).

#### `storage.module.ts`

- **Función:** Abstrae la lógica para interactuar con el servicio de almacenamiento (Cloudflare R2).
- **Servicio:** `storage.service.ts`
  - `uploadFile()`: Sube un archivo al bucket de R2.
  - `deleteFile()`: Elimina un archivo del bucket a partir de su URL pública.

---

## Archivos Relevantes Adicionales

- **`main.ts`**:
  - Punto de entrada de la aplicación.
  - Configura `GlobalPipes` para validación automática de DTOs.
  - Habilita CORS.
  - Inicia el servidor en el puerto definido en las variables de entorno (o 3000 por defecto).

- **`package.json`**:
  - Define los scripts (`start:dev`, `build`, `lint`, etc.).
  - Lista todas las dependencias de producción y desarrollo del proyecto.

- **`Dockerfile`**:
  - Define un build de Docker multi-etapa para crear una imagen de producción optimizada.
  - **Etapa 1 (builder):** Instala todas las dependencias y compila el código TypeScript a JavaScript.
  - **Etapa 2 (production):** Usa una imagen base limpia, instala solo las dependencias de producción y copia el código compilado de la etapa anterior.

- **`.env.template`**:
  - Plantilla que lista todas las variables de entorno necesarias para que la aplicación funcione correctamente, como credenciales de base de datos, secretos de JWT, configuración de Cloudflare R2 y del servicio de correo.