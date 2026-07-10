# ⚓ Ships System

Sistema de gestión de flota marítima construido con **NestJS** como proyecto de aprendizaje didáctico. El sistema cubre el flujo completo desde una landing page pública con agente IA, hasta portales diferenciados por rol con autenticación JWT.

---

## 🧠 Concepto del sistema

Un visitante llega a la landing, habla con el agente IA (Groq/llama-3.3-70b), obtiene cotizaciones, y la IA crea su cuenta automáticamente. Luego inicia sesión y accede a su portal según su rol. Los admins gestionan barcos, viajes y clientes. Los capitanes ven su barco y tripulación. El superadmin tiene control total del sistema.

```
Landing → Chat IA → Crea cuenta → Login → Portal por rol
```

---

## 🛠️ Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework backend | NestJS 11 (TypeScript) |
| ORM | Prisma 5.22 |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT (access 15min + refresh 7d) + Passport |
| Estrategias | passport-jwt (jwt + jwt-refresh) |
| IA | Groq API — llama-3.3-70b-versatile (tool use) |
| Hash passwords | bcryptjs |
| Frontend | HTML / CSS / JS vanilla + i18n ES/EN |
| Serving frontend | ServeStaticModule de NestJS |
| Contenedores | Docker + Docker Compose |
| Package manager | pnpm |

---

## 🏗️ Estructura del proyecto

```
ships-system/
├── prisma/
│   ├── schema.prisma          # Modelos, enums y relaciones
│   └── seed.ts                # Datos de prueba completos
├── public/                    # Frontend servido por NestJS
│   ├── index.html             # Landing page con chat IA
│   ├── login.html             # Login (sin registro manual)
│   ├── portal/
│   │   ├── client.html        # Portal CLIENT
│   │   ├── admin.html         # Portal ADMIN
│   │   ├── captain.html       # Portal CAPTAIN
│   │   └── superadmin.html    # Portal SUPERADMIN
│   ├── css/
│   │   ├── style.css          # Estilos globales (dark theme)
│   │   └── portal.css         # Estilos portales + modales
│   └── js/
│       ├── i18n.js            # Sistema de traducciones ES/EN
│       ├── main.js            # Landing: chat widget + IA
│       ├── auth.js            # Login + redirección por rol
│       ├── portal.js          # Lógica compartida portales (auth, nav, logout)
│       ├── client.js          # Portal cliente (flota, cotizador, viajes, soporte)
│       ├── admin.js           # Portal admin (barcos, viajes, clientes, escalaciones)
│       ├── captain.js         # Portal capitán (barco, viajes, tripulación)
│       └── superadmin.js      # Portal superadmin (usuarios, capitanes)
└── src/
    ├── ai-agent/              # Agente IA con Groq + tool use
    │   ├── tools/
    │   │   ├── get-available-ships.tool.ts
    │   │   ├── get-voyage-pricing.tool.ts
    │   │   ├── get-destination-options.tool.ts
    │   │   ├── create-client-account.tool.ts
    │   │   └── escalate-to-admin.tool.ts
    │   ├── ai-agent.controller.ts   # POST /api/ai-agent/chat | /support
    │   ├── ai-agent.service.ts      # runChat() compartido, chat() y supportChat()
    │   └── ai-agent.module.ts
    ├── auth/
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   └── register.dto.ts
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts    # Extiende AuthGuard('jwt')
    │   │   └── roles.guard.ts       # Verifica rol del usuario
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts      # Valida access token
    │   │   └── jwt-refresh.strategy.ts  # Valida refresh token
    │   ├── decorators/
    │   │   └── roles.decorator.ts   # @Roles('ADMIN', ...)
    │   ├── auth.controller.ts       # register, login, refresh
    │   ├── auth.service.ts          # bcrypt, JWT sign, generateTokens()
    │   └── auth.module.ts
    ├── ships/
    │   ├── ships.controller.ts      # CRUD + stats + findMyCaptainShip
    │   ├── ships.service.ts         # findAvailable, findAll, findOne, update, create, findByCaptain, getStats
    │   └── ships.module.ts
    ├── voyages/
    │   ├── voyages.controller.ts    # my, stats, all, quote, create, ship/:id
    │   ├── voyages.service.ts       # findMyVoyages, findAll, getStats, quote, create, findByShip
    │   └── voyages.module.ts
    ├── users/
    │   ├── users.controller.ts      # me, stats, clients, captains, all, toggle
    │   ├── users.service.ts         # findByEmail, findById, findAll, findClients, findCaptains, getStats, toggleActive
    │   └── users.module.ts
    ├── prisma/
    │   ├── prisma.service.ts        # Extiende PrismaClient, OnModuleInit/Destroy
    │   └── prisma.module.ts         # @Global()
    ├── chat/                        # WebSocket gateway (pendiente)
    ├── queues/                      # BullMQ escalation (pendiente)
    ├── crew/                        # Gestión de tripulación (pendiente)
    ├── maintenance/                 # Mantenimiento de barcos (pendiente)
    ├── common/                      # Guards, interceptors, pipes globales (pendiente)
    ├── app.controller.ts            # GET /api/stats (público) + GET /api/escalations (admin)
    ├── app.module.ts                # ConfigModule, ServeStaticModule, todos los módulos
    ├── app.service.ts
    └── main.ts                      # globalPrefix 'api', listen 3000
```

---

## 👤 Roles y permisos

| Rol | Acceso | Portal |
|-----|--------|--------|
| `CLIENT` | Explorar flota, cotizar, contratar viajes, historial, soporte IA | `/portal/client.html` |
| `CAPTAIN` | Ver su barco asignado, viajes de su barco, tripulación | `/portal/captain.html` |
| `ADMIN` | Gestión de barcos (crear/editar), viajes, clientes, escalaciones | `/portal/admin.html` |
| `SUPERADMIN` | Todo lo del ADMIN + gestión de todos los usuarios y capitanes | `/portal/superadmin.html` |

---

## 🤖 Agente de IA — Tools disponibles

El agente usa **Groq** (gratuito) con `llama-3.3-70b-versatile` y pattern de tool use:

| Tool | Descripción | Disponible en |
|------|-------------|---------------|
| `getAvailableShips` | Lista barcos con status AVAILABLE desde la DB | chat + support |
| `getVoyagePricing` | Calcula cotización con multiplicadores | chat + support |
| `getDestinationOptions` | Retorna rutas disponibles (estático) | chat + support |
| `createClientAccount` | Crea usuario CLIENT + perfil Client en DB | **solo chat** (landing) |
| `escalateToAdmin` | Crea EscalationJob en DB con status PENDING | chat + support |

**Dos endpoints diferenciados:**
- `POST /api/ai-agent/chat` — público, para visitantes en la landing. Puede crear cuentas.
- `POST /api/ai-agent/support` — requiere JWT, para clientes logueados. NO crea cuentas.

**Fórmula de precio:**
```
finalCost = basePrice × durationDays × shipTypeMultiplier × cargoMultiplier × distanceMultiplier
distanceMultiplier = 1 + (distanceKm / 10000)
```

---

## 🌐 Sistema de i18n (ES/EN)

El frontend usa un sistema propio de traducción en `public/js/i18n.js`:

- Objeto `translations` con claves en `es` y `en`
- Función `t(key)` retorna el texto en el idioma actual
- Atributo `data-i18n="clave"` en elementos HTML para traducción automática
- Atributo `data-i18n-placeholder="clave"` para inputs
- `data-portal="true"` en el `<body>` de los portales para diferenciarlo de la landing
- `portal.js` clona el botón de idioma para evitar listeners duplicados con `i18n.js`
- Al cambiar idioma en el portal, se re-renderiza la grilla de barcos (`window.allShips` es global)

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register          Registro (usado internamente por la IA)
POST /api/auth/login             Login → { accessToken, refreshToken }
POST /api/auth/refresh           Refresh token → nuevos tokens
```

### General (AppController)
```
GET  /api/stats                  Estadísticas públicas para la landing
GET  /api/escalations            Escalaciones de IA (ADMIN+)
```

### Ships
```
GET  /api/ships/available        Barcos disponibles (cualquier user logueado)
GET  /api/ships/stats            Estadísticas de flota (ADMIN+)
GET  /api/ships/my               Barco asignado al capitán logueado (CAPTAIN)
GET  /api/ships                  Todos los barcos con capitán y conteos (ADMIN+)
GET  /api/ships/:id              Detalle de un barco (cualquier user logueado)
POST /api/ships                  Crear barco (ADMIN+)
PATCH /api/ships/:id             Editar nombre, status, basePrice (ADMIN+)
```

### Voyages
```
GET  /api/voyages/my             Viajes del cliente logueado (CLIENT)
GET  /api/voyages/stats          Estadísticas de viajes + revenue (ADMIN+)
GET  /api/voyages/ship/:shipId   Viajes de un barco (CAPTAIN, ADMIN+)
GET  /api/voyages                Todos los viajes con cliente y cargo (ADMIN+)
POST /api/voyages/quote          Calcular cotización sin crear viaje (cualquier user)
POST /api/voyages                Contratar viaje — crea voyage + cargo + tariff (CLIENT)
```

### Users
```
GET  /api/users/me               Perfil del usuario logueado
GET  /api/users/stats            Conteo por rol (ADMIN+)
GET  /api/users/clients          Lista clientes con métricas (ADMIN+)
GET  /api/users/captains         Lista capitanes con licencia y barco (SUPERADMIN)
GET  /api/users                  Todos los usuarios (SUPERADMIN)
PATCH /api/users/:id/toggle      Activar/desactivar usuario (SUPERADMIN)
```

### AI Agent
```
POST /api/ai-agent/chat          Chat público — puede crear cuentas (sin auth)
POST /api/ai-agent/support       Chat soporte — NO crea cuentas (CLIENT logueado)
```

---

## 📦 Tipos de barcos y multiplicadores

| Tipo (enum) | Descripción | Multiplicador |
|-------------|-------------|---------------|
| `CONTAINER` | Portacontenedores | ×1.0 |
| `BULK_CARRIER` | Granelero | ×1.1 |
| `TANKER` | Buque tanque | ×1.3 |
| `REEFER` | Buque frigorífico | ×1.5 |
| `HEAVY_LIFT` | Carga pesada | ×1.8 |

## 📦 Tipos de carga y multiplicadores

| Tipo (enum) | Descripción | Multiplicador |
|-------------|-------------|---------------|
| `GENERAL` | Carga general | ×1.0 |
| `BULK` | A granel | ×1.1 |
| `REFRIGERATED` | Refrigerada | ×1.4 |
| `HAZARDOUS` | Peligrosa | ×1.6 |
| `OVERSIZED` | Sobredimensionada | ×2.0 |

---

## 🚀 Instalación y desarrollo

### Prerrequisitos
- Node.js 20+
- pnpm
- Docker + Docker Compose

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd ships-system
```

### 2. Variables de entorno
```bash
cp .env.example .env
```

Editá el `.env`:
```env
# Base de datos (local, para referencia)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ships_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ships_system

# JWT
JWT_SECRET=tu_jwt_secret_aqui
JWT_REFRESH_SECRET=tu_refresh_secret_aqui

# IA — Groq (gratuito en console.groq.com)
GROQ_API_KEY=gsk_...
```

### 3. Instalar dependencias
```bash
pnpm install
```

### 4. Levantar todo con Docker
```bash
docker compose up --build
```

> ⚠️ **En Windows, Prisma no puede leer variables de entorno fuera de Docker.** El único flujo de desarrollo válido es `docker compose up --build`. Nunca corras `prisma` directamente en PowerShell.

### 5. Sincronizar el schema con la DB
```bash
docker compose exec app npx prisma db push
```

### 6. Cargar datos de prueba
```bash
docker compose exec app npx prisma db seed
```

---

## 🔑 Usuarios de prueba (seed)

| Email | Password | Rol |
|-------|----------|-----|
| `superadmin@ships.com` | `super123` | SUPERADMIN |
| `admin@ships.com` | `admin123` | ADMIN |
| `captain@ships.com` | `captain123` | CAPTAIN (barco: MV Asunción Star) |
| `captain2@ships.com` | `captain456` | CAPTAIN (barco: MV Paraná Trader) |
| `client@ships.com` | `client123` | CLIENT |
| `maria@ships.com` | `client456` | CLIENT |
| `carlos@ships.com` | `client789` | CLIENT |

---

## 🌐 URLs del sistema

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000` | Landing page con chat IA |
| `http://localhost:3000/login.html` | Login |
| `http://localhost:3000/portal/client.html` | Portal cliente |
| `http://localhost:3000/portal/admin.html` | Portal admin |
| `http://localhost:3000/portal/captain.html` | Portal capitán |
| `http://localhost:3000/portal/superadmin.html` | Portal superadmin |

---

## 🐳 Comandos Docker útiles

```bash
# Levantar todo (comando principal de desarrollo)
docker compose up --build

# Reset completo — borra la DB
docker compose down -v

# Rebuild forzado (cuando instalás nuevos paquetes con pnpm)
docker compose build --no-cache
docker compose up

# Sincronizar schema Prisma con la DB
docker compose exec app npx prisma db push

# Correr seed
docker compose exec app npx prisma db seed

# Ver la DB en Prisma Studio
docker compose exec app npx prisma studio --port 5555 --browser none
# Luego abrí http://localhost:5555

# Consultar la DB directamente
docker compose exec ships-db psql -U postgres -d ships_system -c "SELECT email, role FROM users;"
```

---

## 📝 Notas importantes de desarrollo

**Prisma en Windows:** Prisma no puede leer variables de entorno en PowerShell. Todo debe correr dentro de Docker.

**Instalar nuevos paquetes:** Instalar con `pnpm add <paquete>` en el host y luego hacer `docker compose build --no-cache` para que Docker tome los nuevos paquetes.

**`pnpm-lock.yaml`:** No debe estar en `.dockerignore`. Si está, Docker falla con `failed to compute cache key`.

**ServeStaticModule:** `AppController` no debe tener `@Get('/')` o pisará el `index.html`.

**i18n en portales:** Los portales usan `data-portal="true"` en el `<body>`. `portal.js` clona el botón `lang-toggle` para remover el listener de `i18n.js` y agregar uno propio que además re-renderiza contenido dinámico.

**`window.allShips`:** La grilla de barcos del portal cliente usa `window.allShips` (global) en vez de variable local para que `portal.js` pueda acceder y re-renderizarla al cambiar idioma.

**Enums del schema:** Los valores correctos son `BULK_CARRIER` (no `BULK`), `HEAVY_LIFT` (no `HEAVY`), `ON_VOYAGE` (no `IN_VOYAGE`).

**ESLint:** Los archivos de `public/` están excluidos del linting TypeScript via `eslint.config.mjs`. Los servicios que usan `as any` para enums de Prisma tienen `/* eslint-disable @typescript-eslint/no-unsafe-assignment */` a nivel de archivo.

---

## 🔮 Módulos pendientes

Los siguientes módulos están estructurados pero vacíos — trabajo de próxima fase:

- `src/chat/` — WebSocket gateway para chat en tiempo real entre usuarios
- `src/queues/` — BullMQ para procesamiento de escalaciones
- `src/crew/` — CRUD de tripulación
- `src/maintenance/` — CRUD de mantenimiento de barcos
- `src/common/` — Pipes de validación, interceptors de respuesta, filtros de excepciones

---

## 📚 Lo que aprendiste construyendo esto

- Arquitectura modular de NestJS (módulos, controllers, services, guards, decorators)
- Inyección de dependencias en NestJS
- Autenticación JWT con Passport y dos estrategias (access + refresh)
- Guards personalizados (`JwtAuthGuard`, `RolesGuard`) con `@Roles()` decorator
- ORM Prisma 5: schema, migraciones, relaciones, enums, `findUnique`, `findMany`, `create`, `update`, `aggregate`
- Pattern de tool use con modelos de lenguaje (Groq)
- Servir archivos estáticos desde NestJS con `ServeStaticModule`
- Docker Compose para desarrollo con múltiples servicios
- Sistema de i18n vanilla sin librerías externas
- Manejo de roles en frontend con JWT decoding