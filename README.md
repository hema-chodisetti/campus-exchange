# CampusExchange - FAU Student Marketplace

A peer-to-peer marketplace exclusively for FAU students. Buy and sell textbooks, electronics, furniture and more within the campus community.

## Tech Stack
- **Monorepo**: NX
- **Frontend**: Angular 21 (`apps/frontend`)
- **Backend**: NestJS 11 (`apps/backend`)
- **Shared types**: `libs/shared`
- **Database**: MySQL 8.0
- **Containerization**: Docker Compose

## Prerequisites

**Docker (recommended)**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

**Local development**
- Node.js 20+
- MySQL 8.0 running locally

## Quick Start

### With Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/losemiros/campusexchange.git
   cd campusexchange
   ```

2. **Create the environment file**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your values:
   ```
   DB_PASSWORD=campuspass
   MYSQL_ROOT_PASSWORD=rootpass
   JWT_SECRET=any-secret-string-here
   ```

3. **Start the application**
   ```bash
   docker compose up --build
   ```
   First build may take 2-3 minutes.

4. **Open in browser**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000/api

### Local Development (without Docker)

1. **Install all dependencies** (single install at the workspace root)
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env` to `apps/backend/.env` or ensure the root `.env` is present.

3. **Run backend and frontend** in separate terminals
   ```bash
   npm run backend    # NestJS on http://localhost:3000
   npm run frontend   # Angular on http://localhost:4200
   ```

   Or run both at once with NX:
   ```bash
   npx nx run-many --target=serve --parallel
   ```

## Default Test Accounts (from seed data)
| Email | Password |
|-------|----------|
| john@fau.edu | password123 |
| jane@fau.edu | password123 |
| admin@fau.edu | password123 |

> `admin@fau.edu` has admin privileges.

## Generating a JWT Secret

The `JWT_SECRET` in your `.env` file should be a strong, random string. You can generate one using any of the following methods:

**Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**OpenSSL**
```bash
openssl rand -hex 64
```

**npm package (one-off)**
```bash
npx crypto-random-string --length 64 --type hex
```

Copy the output and set it as your `JWT_SECRET`:
```
JWT_SECRET=<paste-generated-value-here>
```

> Never commit your `.env` file or share your `JWT_SECRET`. Use a unique secret per environment (dev, staging, production).

## Stopping the Application
```bash
docker compose down
```

To also remove the database volume (fresh start):
```bash
docker compose down -v
```
