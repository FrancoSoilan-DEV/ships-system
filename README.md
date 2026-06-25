<div align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=120&color=gradient&customColorList=6,14,30&reversal=true&text=ships-system&fontColor=ffffff&fontSize=52&fontAlignY=35&desc=NestJS%20%7C%20TypeScript%20%7C%20PostgreSQL%20%7C%20Prisma%20%7C%20WebSockets%20%7C%20AI%20Agent&descAlignY=58&descSize=16" />
</div>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?lines=Maritime+Fleet+Management+System;NestJS+Microservices+%2B+TypeScript;AI+Agent+with+Tool+Use+(Anthropic);Real-time+Chat+%2B+WebSockets;JWT+Auth+%2B+Role-based+Access+Control;Fully+Dockerized+%E2%80%94+One+Command+Setup&center=true&width=850&height=40&color=0EA5E9">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/NestJS-10.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/BullMQ-Queues-FF6B35?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Socket.io-WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
  <img src="https://img.shields.io/badge/Anthropic-AI%20Agent-6B46C1?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/JWT-Auth-F7B731?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Roles and Permissions](#roles-and-permissions)
- [AI Agent — How it works](#ai-agent--how-it-works)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Queue Jobs](#queue-jobs)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Default Users](#default-users)
- [Useful Commands](#useful-commands)

---

## Overview

**ships-system** is a fullstack maritime fleet management platform built with **NestJS microservices** and **TypeScript**. It is designed to manage a shipping company's entire operation: vessels, crews, voyages, cargo, maintenance, and client interactions.

The system combines a **public landing page**, a **role-based admin panel**, a **captain portal**, and a **client portal powered by an AI agent** — all communicating in real time via WebSockets.

The standout feature is an **AI agent built on Anthropic's API with tool use**: it attends potential clients, explains available ships and pricing, calculates voyage costs, and autonomously creates client accounts when the user is ready to book. When a case exceeds the agent's scope, it escalates the conversation to a human admin through a BullMQ queue, handing off the chat seamlessly.

---

## Core Features

- **Public landing page** with company overview and login entry point
- **JWT authentication** with role-based guards across four user types
- **Fleet management** — ships, availability status, capacity, maintenance tracking
- **Crew management** — crew members assigned per ship with roles
- **Voyage management** — origin, destination, duration-based pricing, cargo tracking
- **Real-time tracking** — live ship status updates via WebSockets
- **AI agent** — conversational client onboarding with Anthropic tool use
  - Answers questions about available ships, routes, and pricing
  - Calculates voyage cost based on destination and days
  - Creates client accounts autonomously when the user decides to book
  - Escalates to a human admin when case complexity requires it
- **Real-time chat** — admin ↔ client, admin ↔ captain via WebSockets
- **Chat history** — superadmin can review all AI conversations and human chats
- **BullMQ queues** — escalation jobs, maintenance alerts, report generation
- **Fully Dockerized** — one command to run the entire stack

---

## Tech Stack

<p align="left">
  <img src="https://skillicons.dev/icons?i=ts,nodejs,nestjs,postgres,prisma,redis,docker,github" />
</p>

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript 5 |
| Framework | NestJS 10 (monorepo) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache / Broker | Redis 7 |
| Job Queues | BullMQ via @nestjs/bull |
| Real-time | Socket.io via @nestjs/websockets |
| AI Agent | Anthropic Claude API (tool use) |
| Authentication | JWT via @nestjs/jwt + Passport |
| Containerization | Docker + Docker Compose |
| Testing | Jest (unit) + Supertest (e2e) |
| CI/CD | GitHub Actions |

---

## Architecture

```text
Public browser
  │
  ├── Landing page   (static — company info + login button)
  └── Login / portal (JWT-authenticated SPA or SSR)
        │
        ▼
  API Gateway (NestJS)
  ├── Auth guard (JWT + role check)
  ├── Rate limiting
  └── Routes to microservices via TCP
        │
        ├── ships-service       → fleet CRUD, status, specs, maintenance
        ├── crew-service        → crew members, assignments per ship
        ├── voyage-service      → voyages, pricing, cargo, history
        ├── maintenance-service → maintenance records, alerts
        ├── reports-service     → stats, exports
        ├── chat-service        → WebSocket gateway, real-time messaging
        └── ai-agent-service    → Anthropic tool-use agent, account creation,
                                   escalation to human admin
        │
        ▼
  Redis (BullMQ queues)
  ├── escalation-queue    → AI → human admin handoff
  ├── maintenance-alerts  → scheduled maintenance notifications
  └── reports-queue       → async report generation
        │
        ▼
  PostgreSQL (Prisma ORM)
```

### Escalation flow

```text
Visitor → AI agent chat
    │
    ├── Agent answers, quotes, creates account
    │
    └── Complex case detected
          │
          ▼
    Job pushed to escalation-queue (BullMQ)
          │
          ▼
    Available admin notified (WebSocket event)
          │
          ▼
    Admin takes over chat in real time
          │
          ▼
    Full conversation saved to DB (visible to SUPERADMIN)
```

---

## Project Structure

```text
ships-system/
│
├── apps/
│   ├── api-gateway/              ← Entry point, routing, auth guards
│   ├── ships-service/            ← Fleet management microservice
│   ├── crew-service/             ← Crew management microservice
│   ├── voyage-service/           ← Voyage and pricing microservice
│   ├── maintenance-service/      ← Maintenance records and alerts
│   ├── reports-service/          ← Stats and export microservice
│   ├── chat-service/             ← WebSocket gateway, message persistence
│   └── ai-agent-service/         ← Anthropic agent, tool definitions, escalation
│
├── libs/
│   ├── common/                   ← Shared DTOs, guards, interceptors, decorators
│   ├── prisma/                   ← Shared Prisma client
│   └── contracts/                ← Message patterns between microservices
│
├── prisma/
│   └── schema.prisma             ← All database models
│
├── .github/
│   └── workflows/
│       └── ci.yml                ← GitHub Actions pipeline
│
├── docker-compose.yml
├── nest-cli.json                 ← Monorepo configuration
└── package.json
```

---

## Roles and Permissions

| Resource | SUPERADMIN | ADMIN | CAPTAIN | CLIENT |
|---|---|---|---|---|
| View all users | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ | ❌ |
| View fleet (all ships) | ✅ | ✅ | own ship | available only |
| Manage fleet | ✅ | ✅ | ❌ | ❌ |
| View crew | ✅ | ✅ | own ship | ❌ |
| Manage crew | ✅ | ✅ | ❌ | ❌ |
| Create voyages | ✅ | ✅ | ❌ | ❌ |
| View voyage history | ✅ | ✅ | own ship | own voyages |
| View maintenance records | ✅ | ✅ | own ship | ❌ |
| Chat with admin | ✅ | ✅ | ✅ | ✅ |
| Chat with captain | ✅ | ✅ | ✅ | ❌ |
| View AI chat history | ✅ | ❌ | ❌ | ❌ |
| View all conversations | ✅ | ❌ | ❌ | ❌ |
| Manage tariffs | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ❌ | ❌ |

---

## AI Agent — How it works

The AI agent is built on **Anthropic's Claude API with tool use**. It runs as a standalone NestJS microservice (`ai-agent-service`) and exposes a WebSocket channel for unauthenticated visitors.

### Tools available to the agent

| Tool | Description |
|---|---|
| `get_available_ships` | Returns list of ships available for booking with capacity and specs |
| `get_voyage_pricing` | Calculates cost based on destination country and voyage duration in days |
| `get_destination_options` | Returns available destination countries and routes |
| `create_client_account` | Creates a CLIENT user account and returns credentials |
| `escalate_to_admin` | Pushes an escalation job to BullMQ and notifies available admins |

### Agent conversation flow

```text
1. Visitor opens landing page → starts chat with AI agent (no login required)
2. Agent presents available ships, answers questions about routes and pricing
3. Client selects a ship and destination → agent calculates voyage cost
4. Client decides to book → agent creates account (email + temp password)
5. Client receives credentials → logs in → sees their portal
6. If at any point the visitor needs human help → agent escalates to admin
7. SUPERADMIN can review the full AI conversation history at any time
```

### Escalation criteria (handled by the agent)

- Client explicitly asks to speak with a human
- Complaint or claim about an existing voyage
- Request outside the agent's defined tool scope
- Repeated misunderstanding after 3 attempts

---

## Database Models

> Models will be detailed here as the schema is finalized during development.

| Model | Description |
|---|---|
| `User` | System user — linked to a role (SUPERADMIN, ADMIN, CAPTAIN, CLIENT) |
| `Ship` | Vessel in the fleet — specs, status, capacity, maintenance |
| `CrewMember` | Crew assigned to a ship |
| `Voyage` | A transport job — origin, destination, duration, cost, cargo |
| `Cargo` | Cargo details per voyage |
| `Tariff` | Pricing rules — destination country, duration range, multiplier |
| `Maintenance` | Maintenance record per ship |
| `ChatSession` | A conversation session (AI or human) |
| `ChatMessage` | Individual message in a session |
| `EscalationJob` | Record of AI → human escalation events |

---

## WebSocket Events

> Full event list will be added as the chat-service is built.

| Event | Direction | Description |
|---|---|---|
| `agent:message` | server → client | AI agent response |
| `agent:escalate` | server → admin | Escalation notification |
| `chat:message` | bidirectional | Real-time chat message |
| `chat:join` | client → server | Join a chat room |
| `ship:status_update` | server → client | Live ship status change |
| `voyage:update` | server → client | Voyage progress event |

---

## Queue Jobs

| Queue | Job | Description |
|---|---|---|
| `escalation-queue` | `handle-escalation` | Notify admin, transfer chat context |
| `maintenance-alerts` | `send-alert` | Alert admin when maintenance is due |
| `reports-queue` | `generate-report` | Async fleet or voyage report export |

---

## Docker Setup

| Container | Image | Port | Purpose |
|---|---|---|---|
| `api-gateway` | node:20-alpine | 3000 | NestJS API Gateway |
| `ai-agent-service` | node:20-alpine | 3001 | AI agent microservice |
| `chat-service` | node:20-alpine | 3002 | WebSocket chat service |
| `ships-db` | postgres:16-alpine | 5432 | PostgreSQL database |
| `ships-redis` | redis:7-alpine | 6379 | Redis for BullMQ |
| `bull-board` | — | 3010 | BullMQ dashboard UI |

---

## Environment Variables

> Full `.env.example` will be added when each service is scaffolded.

| Variable | Description |
|---|---|
| `PORT` | API Gateway port |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key for the AI agent |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |

> [!WARNING]
> Never commit your real `.env` file. Use `.env.example` to document required variables.

---

## Default Users

> Seed data will be defined once the schema is finalized.

| Role | Email | Password |
|---|---|---|
| Superadmin | `superadmin@ships-system.com` | `super123` |
| Admin | `admin@ships-system.com` | `admin123` |
| Captain | `captain@ships-system.com` | `captain123` |
| Client | `client@ships-system.com` | `client123` |

> [!WARNING]
> Change all default passwords after first login, especially the Superadmin account.

---

## Useful Commands

```bash
# Start full stack
docker compose up --build

# Start in detached mode
docker compose up --build -d

# Stop containers
docker compose down

# Clean reset (removes volumes)
docker compose down -v

# Run database migrations
npx prisma migrate dev --name init

# Seed the database
npm run seed

# Open Prisma Studio
npx prisma studio

# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

---

## CI/CD Pipeline

The GitHub Actions pipeline runs on every push to `main` and on all pull requests:

```text
push / PR
  │
  ├── Install dependencies
  ├── Run linter (ESLint)
  ├── Run unit tests (Jest)
  ├── Run e2e tests (Supertest)
  ├── Build TypeScript
  └── Build Docker image (on main only)
```

---

<div align="center">
  <h3>Built with NestJS, TypeScript, Prisma, PostgreSQL, Redis, Socket.io, and Anthropic — from scratch.</h3>
</div>

<div align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=100&color=gradient&customColorList=6,14,30&section=footer" />
</div>