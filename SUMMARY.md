# Project Summary: Dicasa Backend

This document provides a technical summary of the Dicasa backend, a NestJS application for real estate management.

## Core Technologies

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens) with Argon2 for password hashing.
- **Package Manager:** Bun
- **Containerization:** Docker
- **File Storage:** Cloudflare R2
- **Emailing:** Nodemailer with Handlebars templates.
- **Caching:** Redis / Valkey for response caching.

---

## Project Structure and Modules

The backend is organized into functional modules, each with its own controller (to handle HTTP routes) and service (for business logic).

### Main Module (`AppModule`)

This is the root module that imports and assembles all other project modules.

- **File:** `src/app.module.ts`
- **Imported Modules:**
  - `AuthModule`: For authentication and user management.
  - `UsersModule`: For user CRUD operations.
  - `PropertiesModule`: For property management.
  - `AppointmentsModule`: To manage appointments and information requests.
  - `ContactModule`: To handle contact form submissions.
  - `LocationModule`: To get location data (states/cities).
  - `MailModule`: Email sending service.
  - `StorageModule`: For uploading and deleting files in Cloudflare R2.
  - `ConfigModule`: For managing environment variables.
  - `MongooseModule`: For connecting to MongoDB.
  - `ScheduleModule`: For scheduled tasks (cron jobs).

---

### 1. `auth` Module

Manages registration, login, and password recovery.

#### `auth.controller.ts`

- **Base Path:** `/auth`
- **Methods:**
  - `POST /login`: Logs in a user.
  - `POST /register`: Registers a new user and sends a confirmation email.
  - `GET /checkToken`: Renews and returns a JWT if the current token is valid.
  - `GET /confirm-email`: Confirms a user's email via a token.
  - `POST /resend-confirmation`: Resends the confirmation email.
  - `POST /forgot-password`: Starts the password recovery process.
  - `POST /verify-reset-code`: Verifies the password reset code.
  - `POST /reset-password`: Resets the user's password.
  - `POST /change-password`: Allows an authenticated user to change their password.

#### `auth.service.ts`

- **Logic:**
  - `register()`: Creates a new user and calls `sendConfirmationEmail`.
  - `login()`: Validates credentials and generates a JWT.
  - `checkToken()`: Generates a new token for a validated user.
  - `confirmEmail()`: Validates the confirmation token and marks the user's email as verified.
  - `sendPasswordResetEmail()`: Generates a reset code and emails it.
  - `verifyResetCode()`: Compares the provided code with the stored hash.
  - `resetPassword()`: Updates the user's password.
  - `changePassword()`: Changes the password after verifying the old one.

---

### 2. `users` Module

Handles CRUD operations for users.

#### `users.controller.ts`

- **Base Path:** `/users`
- **Methods:**
  - `POST /create`: (Superadmin/Admin) Creates a new user (usually agents).
  - `PUT /me/picture`: Allows a user to upload/update their profile picture.
  - `GET /`: (Superadmin/Admin) Gets a list of all users.
  - `GET /:id`: (Superadmin/Admin) Gets a user by their ID.
  - `PATCH /me`: Allows a user to update their own information (name, phone).
  - `PATCH /superadmin/:id`: (Superadmin) Updates any user's information.
  - `DELETE /superadmin/:id`: (Superadmin) Deletes a user.

#### `users.service.ts`

- **Logic:**
  - `create()`: Creates a new user in the database.
  - `findAll()`: Returns all users.
  - `findOneByEmail()` / `findOneById()`: Finds users by email or ID.
  - `updateMyInfo()` / `updateUser()`: Updates user data.
  - `remove()`: Deletes a user from the database.
  - `updateProfilePicture()`: Uploads an image to R2 and updates the URL in the user's profile.
  - `handleUnverifiedUserCleanup()`: Scheduled task (cron job) that deletes unverified users after 7 days.

---

### 3. `properties` Module

Manages everything related to real estate properties.

#### `properties.controller.ts`

- **Base Path:** `/properties`
- **Methods:**
  - `POST /`: (Superadmin/Admin) Creates a new property.
  - `POST /upload`: (Superadmin/Admin) Uploads images for a property.
  - `GET /`: (Public) Gets a list of all properties with filters and pagination.
  - `GET /agent/my-properties`: (Admin/Superadmin) Gets the properties of the authenticated agent.
  - `GET /:id`: (Public) Gets the details of a property by its ID.
  - `PATCH /:id`: (Superadmin/Admin) Updates a property.
  - `DELETE /:id`: (Superadmin/Admin) Deletes a property and its associated images.

#### `properties.service.ts`

- **Logic:**
  - `create()`: Saves a new property in the database, associating it with an agent.
  - `uploadImages()`: Uploads multiple files to Cloudflare R2 and returns the URLs.
  - `findAll()`: Returns a paginated and filtered list of properties. Supports filtering by:
    - `search`: Full-text search.
    - `featured`: Featured properties.
    - `state` and `city`: Location.
    - `type`: Property type (house, apartment, etc.).
    - `status`: Property status (for sale, for rent).
    - `minPrice` and `maxPrice`: Price range.
    - `bedrooms`: Number of bedrooms.
  - `findOne()`: Finds a property by its ID.
  - `update()`: Updates property data.
  - `remove()`: Deletes the property and calls `storageService` to delete the images.
  - `validateLocation()`: Validates that the state and city of the address exist.
  - `invalidatePropertiesCache()`: Invalidates the Redis/Valkey cache when a property is created, updated, or deleted.

---

### 4. `appointments` Module

Manages appointments and information requests from clients.

#### `appointments.controller.ts`

- **Base Path:** `/appointments`
- **Methods:**
  - `POST /`: (Public) Creates a new appointment request.
  - `GET /`: (Superadmin/Admin) Gets all appointments.
  - `GET /me`: (Authenticated) Gets the appointments of the authenticated user.
  - `GET /:id`: (Superadmin/Admin) Gets an appointment by ID.
  - `PATCH /:id`: Updates the status or date of an appointment.
  - `PATCH /:id/reassign-agent`: (Superadmin) Reassigns an appointment to a new agent.
  - `DELETE /:id`: Deletes an appointment.

#### `appointments.service.ts`

- **Logic:**
  - `create()`:
    - Validates that the property exists and has an agent.
    - Checks that the agent does not have another appointment within a +/- 1-hour window.
    - Saves the appointment in the database.
    - Sends a notification email to the agent and a confirmation email to the client.
  - `findAll()`: Returns all appointments.
  - `findOne()`: Finds an appointment by its ID.
  - `findForUser()`: Finds appointments for a user by email or phone number.
  - `update()`: Updates an appointment, validating schedule conflicts if the date changes.
  - `reassignAgent()`: Changes the agent of an appointment, validating that the new agent has no schedule conflicts.
  - `remove()`: Deletes an appointment.

---

### 5. `contact` Module

Handles submissions from the public contact form.

#### `contact.controller.ts`

- **Base Path:** `/contact`
- **Methods:**
  - `POST /send`: (Public) Receives and processes a contact request.

#### `contact.service.ts`

- **Logic:**
  - `handleContactRequest()`:
    - Finds all users with the `SUPERADMIN` role.
    - Sends a notification email (`contact-notification.hbs`) to all superadmins with the contact details.
    - Sends a confirmation email (`client-contact-confirmation.hbs`) to the user who submitted the form.

---

### 6. Support Modules

#### `location.module.ts`

- **Function:** Provides geographical data for Venezuela.
- **Controller:** `location.controller.ts`
  - `GET /location/states`: Returns a list of all states.
  - `GET /location/cities/:stateName`: Returns the cities/municipalities of a specific state.
- **Service:** `location.service.ts`
  - Reads data from the `src/data/venezuela.json` file.

#### `mail.module.ts`

- **Function:** Centralized service for sending transactional emails.
- **Service:** `mail.service.ts`
  - `sendEmail()`: Generic method that uses `MailerService` to send an email using a Handlebars template (`.hbs`).

#### `storage.module.ts`

- **Function:** Abstracts the logic for interacting with the storage service (Cloudflare R2).
- **Service:** `storage.service.ts`
  - `uploadFile()`: Uploads a file to the R2 bucket.
  - `deleteFile()`: Deletes a file from the bucket using its public URL.

---

## Other Relevant Files

- **`main.ts`**:
  - Application entry point.
  - Configures `GlobalPipes` for automatic DTO validation.
  - Enables CORS.
  - Starts the server on the port defined in the environment variables (or 3000 by default).

- **`package.json`**:
  - Defines scripts (`start:dev`, `build`, `lint`, etc.).
  - Lists all production and development dependencies for the project.

- **`Dockerfile`**:
  - Defines a multi-stage Docker build to create an optimized production image.
  - **Stage 1 (builder):** Installs all dependencies and compiles the TypeScript code to JavaScript.
  - **Stage 2 (production):** Uses a clean base image, installs only production dependencies, and copies the compiled code from the previous stage.

- **`.env.template`**:
  - Template that lists all the environment variables required for the application to work correctly, such as database credentials, JWT secrets, Cloudflare R2 configuration, and mail service settings.
