# CampusExchange - FAU Student Marketplace

A peer-to-peer marketplace exclusively for FAU students. Buy and sell textbooks, electronics, furniture and more within the campus community.

## Tech Stack
- **Frontend**: Angular 21
- **Backend**: NestJS 11
- **Database**: MySQL 8.0
- **Containerization**: Docker Compose

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

## Quick Start

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

## Default Test Accounts (from seed data)
| Email | Password |
|-------|----------|
| john@fau.edu | password123 |
| jane@fau.edu | password123 |
| admin@fau.edu | password123 |

> `admin@fau.edu` has admin privileges.

## Stopping the Application
```bash
docker compose down
```

To also remove the database volume (fresh start):
```bash
docker compose down -v
```
