# Dicasa - Real Estate Backend

![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-blue?style=for-the-badge&logo=githubactions)
![Framework](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Database](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Storage](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Cache](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![License](https://img.shields.io/github/license/jefjesuswt/dicasa-backend?style=for-the-badge)

Backend for Dicasa, a real estate management system. Built with [NestJS](https://nestjs.com/), a progressive Node.js framework for building efficient and scalable server-side applications.

## ✨ Features

- ⚡ Response Caching with Redis/Valkey for improved performance
- 🔐 Role-based access control (RBAC) for protected routes
- 👤 User authentication (registration, login, JWT) and profile management
- 🏠 Full property management (CRUD operations)
- 🖼️ Image uploads to Cloudflare R2
- 📅 Appointment scheduling and management
- 👨‍💼 Agent and user management
- 🔍 Advanced property search and filtering
- ✉️ Transactional emails for confirmations and notifications
- 🗺️ Location API for states and cities of Venezuela
- 📝 Contact form handling

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Bun (v1 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jefjesuswt/dicasa-backend.git
   cd dicasa-backend
   ```

2. Install the dependencies:
   ```bash
   # Using Bun (recommended)
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root of the project and add the variables listed in `.env.template`.

   ```
   # .env
   DATABASE_URI=your-mongodb-uri
   REDIS_URL=redis://localhost:6379
   R2_PUBLIC_URL=your-r2-public-url
   CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
   CLOUDFLARE_ACCESS_KEY_ID=your-cloudflare-access-key-id
   CLOUDFLARE_SECRET_ACCESS_KEY=your-cloudflare-secret-key
   R2_BUCKET_NAME=your-r2-bucket-name
   JWT_ACCESS_SECRET=your-jwt-access-secret
   JWT_ACCESS_EXPIRATION=1d
   JWT_CONFIRM_SECRET=your-jwt-confirm-secret
   JWT_CONFIRM_EXPIRATION=1d
   MAIL_HOST=your-mail-host
   MAIL_USER=your-mail-user
   MAIL_PASS=your-mail-pass
   MAIL_PORT=587
   API_URL=http://localhost:3000
   FRONTEND_URL=http://localhost:4200
   ```

4. Start the development server:
   ```bash
   # Using Bun
   bun run start:dev
   ```

The application will be running at `http://localhost:3000`.

## 🛠️ Useful Commands

- **Start development server (with watch mode)**: `bun run start:dev`
- **Start production server**: `bun run start:prod`
- **Build for production**: `bun run build`
- **Run unit tests**: `bun run test`
- **Run e2e tests**: `bun run test:e2e`
- **Run linting**: `bun run lint`

## 🏗️ Project Structure

```
src/
├── app.module.ts         # Root module
├── main.ts               # Application entry point
├── auth/                 # Authentication and authorization
├── users/                # User management
├── properties/           # Property management
├── appointments/         # Appointment scheduling
├── contact/              # Contact form handling
├── location/             # Location data API
├── mail/                 # Email sending service
├── storage/              # File storage service (Cloudflare R2)
├── common/               # Common pipes, guards, etc.
└── data/                 # Static data (e.g., venezuela.json)
```

## 🎨 Technologies Used

- [NestJS](https://nestjs.com/) - Web application framework
- [MongoDB](https://www.mongodb.com/) - NoSQL Database
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling tool
- [Redis](https://redis.io/) / [Valkey](https://valkey.io/) - In-memory data store for caching
- [TypeScript](https://www.typescriptlang.org/) - Typed language that compiles to JavaScript
- [JWT](https://jwt.io/) - For authentication
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) - S3-compatible object storage
- [Nodemailer](https://nodemailer.com/) - For sending emails
- [Handlebars](https://handlebarsjs.com/) - For email templates
- [Bun](https://bun.sh/) - JavaScript runtime and toolkit
- [Docker](https://www.docker.com/) - For containerization

## 📄 License

This project is under the MIT License - see the `LICENSE` file for more details.

---

Developed with ❤️ by [Jeffrey Jesús Jimenez Malave](https://github.com/jefjesuswt)
