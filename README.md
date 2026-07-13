<div align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=120&color=gradient&customColorList=2,12,24&reversal=true&text=Ships%20System&fontColor=ffffff&fontSize=52&fontAlignY=35&desc=NestJS%20%7C%20Prisma%20%7C%20PostgreSQL%20%7C%20Groq%20AI%20%7C%20Docker&descAlignY=58&descSize=16" />
</div>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?lines=Maritime+Fleet+Management+Platform;NestJS+%2B+Prisma+%2B+PostgreSQL;AI+Agent+with+Tool+Calling+(Groq);JWT+Auth+%2B+Role-based+Access+Control;Fully+Dockerized+%E2%80%94+One+Command+Setup&center=true&width=850&height=40&color=34D399">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/JWT-Auth-F7B731?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/pnpm-Package_Manager-F69220?style=for-the-badge&logo=pnpm&logoColor=white"/>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Demo](#demo)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Roles and Permissions](#roles-and-permissions)
- [API Modules](#api-modules)
- [AI Agent](#ai-agent)
- [Pricing Engine](#pricing-engine)
- [Database Models](#database-models)
- [Routes Overview](#routes-overview)
- [Docker Setup](#docker-setup)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Useful Commands](#useful-commands)
- [Known Limitations](#known-limitations)
- [Security Notes](#security-notes)
- [Versión en Español](#versión-en-español)

---

## Overview

**Ships System** is a maritime fleet management platform built as a structured, didactic NestJS project — coming from a Django / FastAPI / Express.js background, the goal was to understand *why* NestJS is organized the way it is (modules, providers, guards, strategies), not just to copy patterns.

The system supports four user roles:

| Role | Main Responsibility |
|---|---|
| Superadmin | Full access — everything Admin has, plus captain management and user activation/deactivation |
| Admin | Fleet operations — ship CRUD, voyage management, client listing, escalation inbox |
| Captain | Operational — view assigned ship, crew roster, voyage history |
| Client | Commercial — explore fleet, quote and book voyages, view history, AI support chat |

A public-facing AI sales agent (Groq / Llama 3.3 70B with tool calling) lives on the landing page, can quote voyages against the same pricing engine used internally, and can self-register new clients.

The project is built with **NestJS**, **Prisma**, **PostgreSQL**, **Groq SDK**, **JWT**, a vanilla **HTML/CSS/JS** frontend served directly by Nest, and **Docker Compose**.

---

## Demo

<div align="center">
  <a href="https://www.youtube.com/watch?v=PE-0fHkedaw">
    <img src="https://img.youtube.com/vi/PE-0fHkedaw/maxresdefault.jpg" alt="Ships System Demo" width="80%"/>
  </a>
  <p><em>Click to watch the full system walkthrough on YouTube</em></p>
</div>

---

## Core Features

- JWT authentication with access + refresh token rotation and route-level `@Roles()` guards
- 4 role-based portals (Superadmin, Admin, Captain, Client), each with its own dashboard and sections
- AI sales agent (Groq, native tool calling) on the public landing page — quotes voyages, lists ships, self-registers clients, escalates to a human
- Separate authenticated AI support agent inside the client portal — same tone, no account creation, can escalate
- Automatic tariff-based pricing engine shared between the AI agent and the real booking endpoint
- Bilingual ES/EN interface across landing, auth, and all 4 portals via a single translation dictionary
- Ship, crew, voyage, cargo, and maintenance tracking
- Escalation inbox for Admin/Superadmin fed directly by the AI agent
- Fully Dockerized — one command to run everything

---

## Tech Stack

<p align="left">
  <img src="https://skillicons.dev/icons?i=nestjs,ts,postgres,prisma,docker,html,css,js" />
</p>

| Layer | Technology |
|---|---|
| Backend Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| ORM | Prisma 5.22 |
| Database | PostgreSQL 16 |
| Authentication | JWT via `@nestjs/jwt` + Passport strategies |
| Password Hashing | bcryptjs |
| AI Provider | Groq SDK (`llama-3.3-70b-versatile`), native tool calling |
| Frontend | Vanilla HTML / CSS / JS, served via `@nestjs/serve-static` |
| Containerization | Docker + Docker Compose |
| Package Manager | pnpm |
| Queue infra (provisioned) | Redis 7 + Bull Board (not yet wired to a queue) |

---

## Architecture

```text
Browser
  │
  ├── HTTP requests  (fetch → REST API under /api)
  ├── Static assets  (index.html, portal/*.html, css, js)
  ▼
NestJS App  (port 3000)
  │
  ├── ServeStaticModule   → serves /public directly, no separate frontend server
  ├── REST endpoints      → business logic + auth, prefixed /api
  ├── Passport strategies → jwt / jwt-refresh
  ├── AI Agent module     → Groq client + 5 tools, reads/writes via Prisma
  └── Prisma Client        → typed queries
  │
  ▼
PostgreSQL 16  (port 5432)

Redis 7 + Bull Board  (ports 6379 / 3010) — provisioned, not yet consumed by app code
```

Because the frontend is served by the same NestJS app (`ServeStaticModule`), there's no CORS to configure and no separate frontend build step.

---

## Project Structure

```text
SHIPS-SYSTEM/
│
├── prisma/
│   ├── schema.prisma           ← 13 models, 7 enums
│   └── seed.ts                  ← ships, users, captains, crew, tariffs, voyages, escalation
│
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   │
│   ├── users/
│   │   ├── dto/update-user.dto.ts
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   │
│   ├── ships/
│   │   ├── dto/
│   │   │   ├── create-ship.dto.ts
│   │   │   └── update-ship.dto.ts
│   │   ├── ships.controller.ts
│   │   ├── ships.module.ts
│   │   └── ships.service.ts
│   │
│   ├── voyages/
│   │   ├── voyages.controller.ts
│   │   ├── voyages.module.ts
│   │   └── voyages.service.ts
│   │
│   ├── ai-agent/
│   │   ├── tools/
│   │   │   ├── get-available-ships.tool.ts
│   │   │   ├── get-voyage-pricing.tool.ts
│   │   │   ├── get-destination-options.tool.ts
│   │   │   ├── create-client-account.tool.ts
│   │   │   └── escalate-to-admin.tool.ts
│   │   ├── ai-agent.controller.ts
│   │   ├── ai-agent.module.ts
│   │   └── ai-agent.service.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── app.controller.ts        ← /api/stats (public), /api/escalations (admin)
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts                  ← global prefix /api
│
├── public/
│   ├── index.html                 ← landing + public AI chat widget
│   ├── login.html                  ← auth
│   ├── portal/
│   │   ├── client.html
│   │   ├── admin.html
│   │   ├── captain.html
│   │   └── superadmin.html
│   ├── js/
│   │   ├── i18n.js                  ← ES/EN dictionary + data-i18n binding
│   │   ├── portal.js                 ← shared auth/nav/logout/lang-toggle for all portals
│   │   ├── main.js                    ← landing chat widget
│   │   ├── auth.js                     ← login + role-based redirect
│   │   ├── client.js
│   │   ├── admin.js
│   │   ├── captain.js
│   │   └── superadmin.js
│   └── css/
│
├── docker-compose.yml
├── Dockerfile
├── .env
└── package.json
```

---

## Roles and Permissions

| Endpoint group | Superadmin | Admin | Captain | Client |
|---|---|---|---|---|
| `GET /users/me` | ✅ | ✅ | ✅ | ✅ |
| `GET /users`, `/users/stats`, `/users/clients` | ✅ | ✅ | ❌ | ❌ |
| `GET /users/captains`, `PATCH /users/:id/toggle` | ✅ | ❌ | ❌ | ❌ |
| `GET /ships/available`, `/ships/:id` | ✅ | ✅ | ✅ | ✅ |
| `GET /ships`, `/ships/stats`, `POST/PATCH /ships` | ✅ | ✅ | ❌ | ❌ |
| `GET /ships/my` | ❌ | ❌ | ✅ | ❌ |
| `GET /voyages/my`, `POST /voyages/quote`, `POST /voyages` | ✅ | ✅ | ✅ | ✅ |
| `GET /voyages`, `/voyages/stats` | ✅ | ✅ | ❌ | ❌ |
| `GET /voyages/ship/:shipId` | ✅ | ✅ | ✅ | ❌ |
| `GET /escalations` | ✅ | ✅ | ❌ | ❌ |
| `POST /ai-agent/chat` (public) | ✅ | ✅ | ✅ | ✅ |
| `POST /ai-agent/support` (any logged-in user) | ✅ | ✅ | ✅ | ✅ |

> Role checks are enforced with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` at the route level — there's no role logic duplicated in services.

---

## API Modules

### Auth

```text
POST /api/auth/register     → creates a user, always as role CLIENT
POST /api/auth/login        → returns { accessToken, refreshToken }
POST /api/auth/refresh      → issues a new access token (guard: jwt-refresh strategy)
```

### Users

```text
GET   /api/users/me            → current user profile
GET   /api/users/stats         → counts by role (admin)
GET   /api/users/clients       → all clients with totalVoyages/totalSpent (admin)
GET   /api/users               → all users (admin)
GET   /api/users/captains      → all captains + assigned ship (superadmin)
PATCH /api/users/:id/toggle    → activate/deactivate a user (superadmin)
```

### Ships

```text
GET   /api/ships/available    → ships with status AVAILABLE (any logged-in user)
GET   /api/ships/stats        → total / available / maintenance / on-voyage counts (admin)
GET   /api/ships               → full fleet with captain + counts (admin)
GET   /api/ships/:id           → single ship detail (any logged-in user)
PATCH /api/ships/:id           → update name/status/basePrice (admin)
POST  /api/ships                → create a new ship (admin)
GET   /api/ships/my            → the ship assigned to the logged-in captain
```

### Voyages

```text
GET  /api/voyages/my               → voyages for the logged-in client
GET  /api/voyages/stats            → totals + revenue from completed voyages (admin)
GET  /api/voyages                   → all voyages (admin)
POST /api/voyages/quote             → calculate price without booking (any logged-in user)
POST /api/voyages                    → book a voyage, creates Voyage + Cargo, updates Client totals
GET  /api/voyages/ship/:shipId       → voyage history for a specific ship (captain/admin)
```

### AI Agent

```text
POST /api/ai-agent/chat       → public, can create client accounts
POST /api/ai-agent/support    → authenticated, cannot create accounts, can escalate
```

### App (misc)

```text
GET /api/stats           → public landing stats (fleet size, active voyages, featured ship)
GET /api/escalations      → escalation inbox (admin)
```

---

## AI Agent

Built directly on the **Groq SDK** (`llama-3.3-70b-versatile`) using native tool calling — no LangChain or extra abstraction, to understand the raw request → tool-call → tool-result → response loop.

| Endpoint | Guard | Can create accounts? | Use case |
|---|---|---|---|
| `POST /api/ai-agent/chat` | Public | ✅ Yes | Landing page — visitor asks about ships, gets a quote, agent creates their `CLIENT` account with a temp password |
| `POST /api/ai-agent/support` | `JwtAuthGuard` | ❌ No | Authenticated portal — logged-in users get support and can be escalated to a human, never re-prompted to register |

**Tools available to the agent:**

| Tool | What it does |
|---|---|
| `getAvailableShips` | Reads live fleet data from Postgres via Prisma |
| `getVoyagePricing` | Runs the same multiplier formula as the real booking engine |
| `getDestinationOptions` | Static route/distance reference table |
| `createClientAccount` | Hashes a temp password with bcrypt, creates `User` + `Client` (public endpoint only) |
| `escalateToAdmin` | Creates an `EscalationJob`, visible in the Admin/Superadmin panel |

---

## Pricing Engine

Both the AI agent's `getVoyagePricing` tool and the real `POST /api/voyages/quote` endpoint run the exact same formula, so a quote given in chat matches the price at booking time:

```text
finalCost = basePrice × durationDays × shipTypeMultiplier × cargoMultiplier × distanceMultiplier

distanceMultiplier = 1 + (distanceKm / 10000)
```

| Ship type | Multiplier | Cargo type | Multiplier |
|---|---|---|---|
| Container | ×1.0 | General | ×1.0 |
| Bulk carrier | ×1.1 | Bulk | ×1.1 |
| Tanker | ×1.3 | Refrigerated | ×1.4 |
| Reefer | ×1.5 | Hazardous | ×1.6 |
| Heavy lift | ×1.8 | Oversized | ×2.0 |

When a voyage is booked, if no `Tariff` exists yet for that exact `shipType` + `cargoType` combination, one is auto-created from the multipliers above.

---

## Database Models

<details>
<summary><strong>User</strong> — account + role</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| name | String | Display name |
| email | String (unique) | Login identifier |
| password | String | bcrypt hash |
| role | Enum | SUPERADMIN / ADMIN / CAPTAIN / CLIENT |
| isActive | Boolean | Toggle used by superadmin to disable accounts |

</details>

<details>
<summary><strong>Captain</strong> — extended profile for role CAPTAIN</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| licenseNumber | String (unique) | Maritime license |
| userId | String (unique, FK) | Linked User |
| ship | Ship? | The ship this captain currently commands (optional, 1:1) |

</details>

<details>
<summary><strong>Client</strong> — extended profile for role CLIENT</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| companyName / phone / country | String? | Optional business info |
| totalVoyages | Int | Incremented on each completed voyage |
| totalSpent | Float | Incremented by `finalCost` on each completed voyage |

</details>

<details>
<summary><strong>Ship</strong> — fleet vessel</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| name | String (unique) | e.g. "MV Asunción Star" |
| flag | String | Country of registration |
| type | Enum | CONTAINER / BULK_CARRIER / TANKER / REEFER / HEAVY_LIFT |
| status | Enum | AVAILABLE / ON_VOYAGE / MAINTENANCE / UNAVAILABLE |
| yearBuilt | Int | — |
| capacityTeu | Int | 0 for non-container types |
| maxWeightTons | Float | — |
| basePrice | Float | USD/day, set by admin |
| captainId | String? (unique, FK) | Assigned captain, if any |

</details>

<details>
<summary><strong>CrewMember</strong> — belongs to a Ship</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| name / role / nationality | String | e.g. "Chief Engineer" |
| shipId | String (FK) | Parent ship |

</details>

<details>
<summary><strong>Tariff</strong> — pricing rule</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| shipType / cargoType | Enum | Matching keys |
| shipTypeMultiplier / cargoMultiplier / distanceMultiplier | Float | Applied in the pricing formula |
| destinationRegion | String | Free-text region label |
| isActive | Boolean | — |

Auto-created by `VoyagesService.create()` the first time a `shipType` + `cargoType` combination is booked without a matching tariff.

</details>

<details>
<summary><strong>Voyage</strong> — a contracted trip</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| origin / destination / country / region | String | — |
| durationDays | Int | — |
| status | Enum | SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED |
| departureAt / arrivalAt | DateTime | — |
| finalCost | Float | Result of the pricing formula |
| shipId / clientId / tariffId | String (FK) | Relations |
| cargo | Cargo? | Optional 1:1 |

</details>

<details>
<summary><strong>Cargo</strong> — belongs to a Voyage</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| type | Enum | GENERAL / REFRIGERATED / HAZARDOUS / BULK / OVERSIZED |
| weightTons | Float | — |
| teuCount | Int | 0 for non-container cargo |
| voyageId | String (unique, FK) | Parent voyage |

</details>

<details>
<summary><strong>Maintenance</strong> — belongs to a Ship</summary>

| Field | Type | Description |
|---|---|---|
| id | String (cuid) | Primary key |
| description | String | — |
| performedAt / nextDueAt | DateTime | — |
| cost | Float? | — |
| notes | String? | — |

> ⚠️ There is **no `type` field** on this model — a common mistake when writing seed data.

</details>

<details>
<summary><strong>ChatSession / ChatMessage / EscalationJob</strong> — AI chat + human handoff</summary>

| Model | Key fields |
|---|---|
| ChatSession | `type` (AI_AGENT / HUMAN), `status` (ACTIVE / ESCALATED / CLOSED), `visitorName`, `visitorEmail` |
| ChatMessage | `content`, `isFromAI`, `senderId?`, belongs to a session |
| EscalationJob | `reason`, `status` (PENDING / ASSIGNED / RESOLVED), `adminId?`, created by the `escalateToAdmin` tool |

</details>

---

## Routes Overview

### Backend (NestJS) — port 3000, prefix `/api`

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/users/me
GET    /api/users/stats
GET    /api/users/clients
GET    /api/users
GET    /api/users/captains
PATCH  /api/users/:id/toggle

GET    /api/ships/available
GET    /api/ships/stats
GET    /api/ships
GET    /api/ships/:id
PATCH  /api/ships/:id
POST   /api/ships
GET    /api/ships/my

GET    /api/voyages/my
GET    /api/voyages/stats
GET    /api/voyages
POST   /api/voyages/quote
POST   /api/voyages
GET    /api/voyages/ship/:shipId

POST   /api/ai-agent/chat
POST   /api/ai-agent/support

GET    /api/stats
GET    /api/escalations
```

### Frontend (static, served by NestJS)

```text
/                        Landing + public AI chat widget
/login.html                Login
/portal/client.html         Client portal
/portal/admin.html           Admin portal
/portal/captain.html          Captain portal
/portal/superadmin.html        Superadmin portal
```

---

## Docker Setup

The project runs with four containers:

| Container | Image | Port | Purpose |
|---|---|---|---|
| `ships-app` | node:20-alpine | 3000 | NestJS backend + static frontend |
| `ships-db` | postgres:16-alpine | 5432 | PostgreSQL database |
| `ships-redis` | redis:7-alpine | 6379 | Redis (provisioned, not yet consumed) |
| `ships-bull-board` | deadly0/bull-board | 3010 | Queue dashboard (idle — no queue registered yet) |

`ships-app` waits on `ships-db`'s `pg_isready` healthcheck before starting, and runs `npx prisma db push` automatically as part of its container `CMD` before booting Nest in watch mode.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd ships-system
```

### 2. Create the environment file

```bash
cp .env.example .env
```

Fill in `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `GROQ_API_KEY` (see [Environment Variables](#environment-variables) — note the `.env.example` currently ships with `ANTHROPIC_API_KEY` instead of `GROQ_API_KEY`, that needs to be renamed).

### 3. Start everything

```bash
docker compose up --build -d
```

### 4. Push the schema and seed the database

```bash
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed
```

### 5. Open the app

```text
http://localhost:3000
```

Default credentials from the seed:

| Email | Password | Role |
|---|---|---|
| superadmin@ships.com | super123 | Superadmin |
| admin@ships.com | admin123 | Admin |
| captain@ships.com | captain123 | Captain (assigned to MV Asunción Star) |
| captain2@ships.com | captain123 | Captain (no ship assigned) |
| client@ships.com | client123 | Client |

---

## Environment Variables

### App (`.env`)

| Variable | Description |
|---|---|
| `PORT` | App port (default 3000) |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | Postgres connection string |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Used by `ships-db` and interpolated into `DATABASE_URL` inside `docker-compose.yml` |
| `REDIS_HOST` / `REDIS_PORT` | Read by nothing yet — provisioned for future BullMQ integration |
| `JWT_SECRET` | Signs access tokens (15 min expiry) |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (7 day expiry) |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Currently declared but not read — expirations are hardcoded in `AuthService.generateTokens()` instead |
| `GROQ_API_KEY` | Required by `AIAgentService` — **not** `ANTHROPIC_API_KEY`, see note above |

---

## Useful Commands

```bash
# Start with rebuild, detached
docker compose up --build -d

# Stop everything and wipe volumes (full reset)
docker compose down -v

# Push schema changes without a migration history
docker compose exec app npx prisma db push

# Seed the database (safe to re-run — uses upsert/existence checks)
docker compose exec app npx prisma db seed

# Tail app logs
docker compose logs -f app

# Open a shell inside the app container
docker compose exec app sh

# Local (non-Docker) dev loop
pnpm run start:dev
pnpm run lint
pnpm run format
pnpm run build
```

> PowerShell doesn't support chaining commands with `&&` on older versions — use `;` or run each command on its own line instead.

---

## Known Limitations

- No `class-validator` decorators on DTOs and no global `ValidationPipe` in `main.ts` — request validation is currently manual/implicit.
- `AuthService.register()` hardcodes `role: 'CLIENT'` — Admin/Captain/Superadmin accounts only exist via the seed or direct DB management, there's no self-service escalation path.
- Redis and Bull Board are defined in `docker-compose.yml` but no `BullMQModule`, queue, or processor exists yet — escalations are written straight to Postgres via Prisma, synchronously.
- `@prisma/adapter-pg` is pinned to a `7.x` major in `package.json` while `prisma` / `@prisma/client` are on `5.22` — a version mismatch worth aligning before it causes confusing type errors.
- `.env.example` currently lists `ANTHROPIC_API_KEY` instead of the `GROQ_API_KEY` the code actually reads.

---

## Security Notes

Before deploying to production:

- Never commit `.env` files
- Use long, random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Add a global `ValidationPipe` and `class-validator` decorators to every DTO
- Restrict `ServeStaticModule` / add CORS rules if the frontend is ever split into its own origin
- Use HTTPS in production
- Rotate any credentials that were ever exposed

---

<div align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=120&color=gradient&customColorList=2,12,24&section=footer&text=Versi%C3%B3n%20en%20Espa%C3%B1ol&fontColor=ffffff&fontSize=32&fontAlignY=55" />
</div>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?lines=Plataforma+de+Gesti%C3%B3n+de+Flota+Mar%C3%ADtima;NestJS+%2B+Prisma+%2B+PostgreSQL;Agente+IA+con+Tool+Calling+(Groq);Auth+JWT+%2B+Control+de+Acceso+por+Rol;Todo+en+Docker+%E2%80%94+Un+solo+comando&center=true&width=850&height=40&color=34D399">
</p>

---

# Versión en Español

## Descripción General

**Ships System** es una plataforma de gestión de flota marítima construida como proyecto didáctico de NestJS — viniendo de un background en Django / FastAPI / Express.js, el objetivo fue entender el *por qué* de la estructura de NestJS (módulos, providers, guards, strategies), no solo copiar patrones.

El sistema soporta cuatro roles:

| Rol | Responsabilidad principal |
|---|---|
| Superadmin | Acceso completo — todo lo de Admin, más gestión de capitanes y activación/desactivación de usuarios |
| Admin | Operaciones de flota — CRUD de barcos, gestión de viajes, listado de clientes, bandeja de escalaciones |
| Captain | Operativo — ver su barco asignado, tripulación, historial de viajes |
| Client | Comercial — explorar flota, cotizar y contratar viajes, ver historial, chat de soporte con IA |

Un agente de IA público (Groq / Llama 3.3 70B con tool calling) vive en la landing, cotiza viajes usando el mismo motor de precios que el sistema interno, y puede autoregistrar clientes nuevos.

---

## Funcionalidades Principales

- Autenticación JWT con access + refresh token y guards por rol a nivel de ruta
- 4 portales según rol (Superadmin, Admin, Captain, Client), cada uno con su dashboard
- Agente de IA de ventas (Groq, tool calling nativo) en la landing pública — cotiza, lista barcos, autoregistra clientes, escala a un humano
- Agente de soporte autenticado dentro del portal cliente — mismo tono, sin creación de cuentas, puede escalar
- Motor de precios automático por tarifa, compartido entre la IA y el endpoint real de reservas
- Interfaz bilingüe ES/EN en landing, auth y los 4 portales con un solo diccionario de traducciones
- Seguimiento de barcos, tripulación, viajes, carga y mantenimiento
- Bandeja de escalaciones para Admin/Superadmin, alimentada directamente por el agente de IA
- Completamente Dockerizado — un solo comando para levantar todo

---

## Motor de Precios

```text
finalCost = basePrice × durationDays × shipTypeMultiplier × cargoMultiplier × distanceMultiplier

distanceMultiplier = 1 + (distanceKm / 10000)
```

Tanto la tool `getVoyagePricing` del agente de IA como el endpoint real `POST /api/voyages/quote` usan exactamente la misma fórmula, así que una cotización dada por chat coincide con el precio al momento de reservar.

---

## Inicio Rápido con Docker

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd ships-system

# Crear el archivo de entorno
cp .env.example .env
# completar JWT_SECRET, JWT_REFRESH_SECRET y GROQ_API_KEY

# Levantar todo
docker compose up --build -d

# Aplicar el schema y poblar la base de datos
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed

# Abrir en el navegador
http://localhost:3000
```

Credenciales por defecto del seed:

| Email | Contraseña | Rol |
|---|---|---|
| superadmin@ships.com | super123 | Superadmin |
| admin@ships.com | admin123 | Admin |
| captain@ships.com | captain123 | Captain (con barco asignado) |
| captain2@ships.com | captain123 | Captain (sin barco) |
| client@ships.com | client123 | Client |

---

## Comandos Útiles

```bash
docker compose up --build -d        # Levantar con rebuild, en segundo plano
docker compose down -v                # Bajar todo y borrar volúmenes (reset completo)
docker compose exec app npx prisma db push   # Aplicar schema
docker compose exec app npx prisma db seed    # Poblar la base de datos
docker compose logs -f app                     # Ver logs del backend
docker compose exec app sh                      # Abrir shell dentro del contenedor
```

> En PowerShell, las versiones viejas no soportan `&&` para encadenar comandos — usá `;` o ejecutá cada línea por separado.

---

## Limitaciones Conocidas

- Sin `class-validator` en los DTOs ni `ValidationPipe` global — la validación es manual/implícita por ahora
- `AuthService.register()` fuerza `role: 'CLIENT'` — las cuentas Admin/Captain/Superadmin solo existen vía seed o gestión manual de la DB
- Redis y Bull Board están definidos en `docker-compose.yml` pero no hay ningún `BullMQModule` conectado todavía — las escalaciones se escriben directo a Postgres, de forma síncrona
- `@prisma/adapter-pg` está en una major `7.x` mientras que `prisma`/`@prisma/client` están en `5.22` — conviene alinear versiones
- El `.env.example` lista `ANTHROPIC_API_KEY` pero el código lee `GROQ_API_KEY`

---

## Seguridad

Antes de deployar a producción:

- Nunca subir archivos `.env` al repositorio
- Usar valores largos y aleatorios para `JWT_SECRET` y `JWT_REFRESH_SECRET`
- Agregar `ValidationPipe` global y decoradores de `class-validator` en cada DTO
- Restringir orígenes si el frontend alguna vez se separa del backend
- Usar HTTPS en producción
- Rotar cualquier credencial que haya sido expuesta

---

<div align="center">
  <h3>Built with NestJS, Prisma, PostgreSQL, Groq AI, Docker and a lot of ☕</h3>
</div>

<div align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=100&color=gradient&customColorList=2,12,24&section=footer" />
</div>