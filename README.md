<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-all.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
  <a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master" alt="Coverage" /></a>
  <a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/discord/926828221233229824?color=5865F2&label=discord&logo=discord&logoColor=white" alt="Discord" /></a>
</p>

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
- Docker (for deployment)

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

## 🐳 Deployment

This project is configured for easy deployment using Docker.

1.  **Build the Docker image:**

    ```bash
    docker build -t dicasa-backend .
    ```

2.  **Run the Docker container:**
    ```bash
    docker run -p 3000:3000 --env-file .env dicasa-backend
    ```

The `docker-compose.yml` file is also provided for a more robust setup, including a Caddy reverse proxy for automatic HTTPS.

```bash
docker-compose up -d
```

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

## 📖 API Documentation

This project uses NestJS, which can be integrated with Swagger for automatic API documentation generation. To enable this, you would typically uncomment the relevant lines in `main.ts`.

Once enabled, the API documentation would be available at `http://localhost:3000/api`.

## 🎨 Technologies Used

- **[NestJS](https://nestjs.com/)**: A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- **[MongoDB](https://www.mongodb.com/)**: A NoSQL database for storing application data.
- **[Mongoose](https://mongoosejs.com/)**: An elegant mongodb object modeling for node.js.
- **[Redis](https://redis.io/) / [Valkey](https://valkey.io/)**: In-memory data structure store, used as a database, cache and message broker.
- **[TypeScript](https://www.typescriptlang.org/)**: A typed superset of JavaScript that compiles to plain JavaScript.
- **[JWT](https://jwt.io/)**: JSON Web Tokens are an open, industry standard RFC 7519 method for representing claims securely between two parties.
- **[Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)**: S3-compatible object storage, without the egress fees.
- **[Nodemailer](https://nodemailer.com/)**: A module for Node.js applications to allow easy as cake email sending.
- **[Handlebars](https://handlebarsjs.com/)**: A popular templating engine.
- **[Bun](https://bun.sh/)**: A fast JavaScript all-in-one toolkit.
- **[Docker](https://www.docker.com/)**: A platform for developing, shipping, and running applications in containers.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

<p align="center">
  Developed with ❤️ by <a href="https://github.com/jefjesuswt" target="_blank">Jeffrey Jesús Jimenez Malave</a>
</p>
