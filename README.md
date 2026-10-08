<div align="center">

# 🎟️ FlickPass
### *Enterprise-Grade Movie Ticket Booking & Real-Time Seat Reservation Engine*

[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express 5](https://img.shields.io/badge/Backend-Express%205%20%7C%20Node.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma%207-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis Locking](https://img.shields.io/badge/Cache%20%26%20Lock-Redis%20TTL-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-concurrency--locking-engine">Concurrency Engine</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-documentation">API Reference</a> •
  <a href="#-database-design">Database Design</a>
</p>

---

</div>

## 📌 Overview

**FlickPass** is a full-stack movie ticket booking platform designed to replicate the reliability, aesthetics, and high-concurrency safeguards required by modern cinema chains (such as BookMyShow, AMC, and PVR).

Building ticket booking systems involves critical distributed systems challenges—most notably **high-concurrency race conditions** where thousands of simultaneous users attempt to claim identical seats. **FlickPass solves this** with a two-phase reservation engine combining **atomic Redis distributed locks** (with automated 5-minute TTL expirations) and **PostgreSQL ACID transactions** wrapped in Prisma.

Additionally, FlickPass includes a **zero-downtime resilient fallback system**: if external Redis or PostgreSQL instances are unavailable, an integrated in-memory TTL lock manager and local persistence engine seamlessly take over without breaking user workflows.

---

## ⚡ Key Features

### 🎬 Cinematic Client Experience
* **Hero Carousel & Trailer Integration**: Fluid, auto-cycling hero showcase highlighting trending blockbusters with high-definition backdrops, movie ratings, and direct YouTube trailer playback.
* **Smart Catalog & Filter Engine**: Instant client-side search with multi-parameter filtering across genres, language tracks, and release states (*Now Playing* vs. *Upcoming*).
* **Comprehensive Movie Hub**: Dedicated movie detail view displaying synopses, categorized runtimes, TMDB cast and crew portraits, and theater showtime schedules.
* **Interactive Cinema Seat Map**:
  - Curved perspective visualization replicating modern cinema auditoriums.
  - Multi-tier seat layout distinguishing **VIP recliners** from **Standard seating**.
  - Dynamic visual state indicators: `Available`, `Selected`, `Temporarily Locked`, and `Reserved`.
  - Enforced business rules: Maximum of 6 seats per transaction.
* **Live Lock Expiration Timer**: Synchronized 5-minute countdown timer with color-coded warning states that automatically purges locks when abandoned.
* **Slide-out Cart & Itemized Checkout**: Transparent pricing drawer calculating seat category subtotals, GST/convenience fees, and promo calculations.
* **Cryptographic Digital Pass with QR Code**: Instant e-ticket generation featuring cinema location, screen number, show timings, and a unique cryptographic QR pass for ticket verification.
* **Persistent Authentication & Demo Mode**: JWT-based session security with 1-click **Demo Login** (`demo@flickpass.com`) for immediate testing.

---

## 🏗️ System Architecture

FlickPass separates concerns between a reactive, decoupled Single Page Application (SPA) and an Express 5 REST API backed by distributed locking and relational storage.

```mermaid
graph TD
    User([Cinema Patron]) -->|HTTPS / Browsing| FE[React 19 + Vite Frontend]
    FE -->|State Management| Zustand[Zustand Stores<br/>Auth & Seat Locks]
    FE -->|Data Sync & Polling| ReactQuery[TanStack Query v5]
    
    ReactQuery -->|REST API / JSON| API[Express 5 Backend Server]
    
    subgraph "Backend Engine"
        API --> AuthMW[JWT Authentication & Validation]
        API --> MovieCtrl[Movies Controller]
        API --> ShowCtrl[Shows Controller]
        API --> BookingCtrl[Booking & Lock Controller]
        
        BookingCtrl --> LockEngine{Redis Lock Engine}
        LockEngine -->|Connected| Redis[(Redis Key-Value Cache)]
        LockEngine -->|Offline Fallback| MemStore[(In-Memory TTL Store)]
        
        BookingCtrl --> TxEngine{ACID Transaction Engine}
        TxEngine -->|Connected| Postgres[(PostgreSQL 16)]
        TxEngine -->|Offline Fallback| LocalDB[(Resilient Local DB)]
        
        MovieCtrl --> TMDB[TMDB External API]
    end
```

---

## 🔒 Concurrency & Locking Engine

Preventing seat overlap is the most vital engineering aspect of FlickPass. The platform utilizes a **Two-Phase Reservation Pattern**:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as User A (Alice)
    actor Bob as User B (Bob)
    participant API as FlickPass API
    participant Redis as Redis Cache (TTL = 300s)
    participant DB as PostgreSQL Database

    Note over Alice,Bob: Both view the same screening simultaneously
    Alice->>API: POST /api/bookings/lock-seats [Seats: B4, B5]
    API->>Redis: Atomic Lock Query (SETNX show:seat:B4, B5)
    Redis-->>API: Lock SUCCESS (Granted to Alice)
    API-->>Alice: 200 OK (5-min lock session initiated)

    Bob->>API: POST /api/bookings/lock-seats [Seats: B5, B6]
    API->>Redis: Atomic Lock Query (SETNX show:seat:B5, B6)
    Redis-->>API: Lock CONFLICT (B5 already held by Alice)
    API-->>Bob: 409 Conflict ("Seat B5 is held by another user")

    alt Alice Completes Checkout within 5 minutes
        Alice->>API: POST /api/bookings/confirm [Seats: B4, B5]
        API->>Redis: Verify Alice's active lock token
        API->>DB: BEGIN TRANSACTION
        DB->>DB: Check isReserved == false
        DB->>DB: UPDATE seats SET isReserved = true
        DB->>DB: INSERT INTO bookings, booking_seats
        API->>DB: COMMIT TRANSACTION
        API->>Redis: Release Redis locks
        API-->>Alice: 201 Created (Confirmed E-Ticket + QR Code)
    else Alice Abandons or Timer Expires
        Redis-->>Redis: TTL 300s expires naturally
        Note over Redis: Seats B4 and B5 return to available pool
    end
```

---

## 💻 Tech Stack

### Frontend Ecosystem
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.3.0` | Declarative, component-driven UI architecture |
| **TypeScript** | `~6.0.2` | Strict end-to-end type safety |
| **Vite** | `^8.3.0` | Ultra-fast HMR and optimized production bundling |
| **Tailwind CSS** | `^4.3.3` | Utility-first styling with modern CSS variables |
| **TanStack React Query** | `^5.104.1` | Asynchronous cache handling & live seat polling |
| **Zustand** | `^5.0.15` | Minimalist client state & session persistence |
| **Framer Motion** | `^14.0.0` | Micro-interactions and drawer transitions |
| **Lucide React** | `^1.53.0` | Modern, consistent SVG iconography |

### Backend Ecosystem
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>=20.x` | JavaScript runtime environment |
| **Express** | `^5.2.1` | Next-generation routing and middleware framework |
| **Prisma ORM** | `^7.10.0` | Type-safe SQL query generation and schema migration |
| **PostgreSQL** | `16+` | ACID-compliant relational data store |
| **Redis** | `^6.3.0` | In-memory distributed seat locking and key caching |
| **Bcrypt.js** | `^3.0.3` | Salted password hashing |
| **JSONWebToken** | `^9.0.3` | Stateless bearer token authentication |

---

## 🗄️ Database Design

```mermaid
erDiagram
    User ||--o{ Booking : places
    Movie ||--o{ Show : schedules
    Theater ||--o{ Show : hosts
    Show ||--o{ Seat : contains
    Show ||--o{ Booking : booked_for
    Booking ||--o{ BookingSeat : includes
    Seat ||--o{ BookingSeat : reserved_in

    User {
        String id PK
        String email UK
        String name
        String passwordHash
        DateTime createdAt
    }

    Movie {
        String id PK
        Int tmdbId UK
        String title
        String overview
        Int durationMins
        String posterUrl
        String backdropUrl
        DateTime releaseDate
        String[] genres
        Float rating
    }

    Theater {
        String id PK
        String name
        String location
        Int totalScreens
    }

    Show {
        String id PK
        String movieId FK
        String theaterId FK
        Int screenNumber
        DateTime startTime
        DateTime endTime
        Float priceStandard
        Float priceVip
        Boolean isActive
    }

    Seat {
        String id PK
        String showId FK
        String rowLabel
        Int seatNumber
        SeatCategory category
        Boolean isReserved
    }

    Booking {
        String id PK
        String userId FK
        String showId FK
        Float totalAmount
        BookingStatus status
        String qrCodeHash
        DateTime createdAt
    }

    BookingSeat {
        String id PK
        String bookingId FK
        String seatId FK
    }
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure your development environment has the following installed:
* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v9+ or `pnpm`)
* *(Optional)* **PostgreSQL** and **Redis** (FlickPass automatically activates embedded in-memory and local DB fallback engines if external instances are not detected).

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ShivamChaturvedi54/FlickPass.git
cd FlickPass
```

---

### 2️⃣ Backend Configuration & Startup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

#### `.env` Configuration Reference:
```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/flickpass"

# Redis Server
REDIS_URL="redis://localhost:6379"

# TMDB API (Optional: mock fallback will be used if left blank)
TMDB_API_KEY="your_tmdb_api_key_here"
TMDB_BASE_URL="https://api.themoviedb.org/3"

# Server Port & Mode
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET="flickpass_super_secret_jwt_key_2026"

# Frontend Origin (CORS)
FRONTEND_URL="http://localhost:5173"
```

#### Database Migration & Seeding:
```bash
# Push schema to database
npm run db:push

# Populate sample theaters, shows, and movies
npm run seed

# Start API server in development mode
npm run dev
```
> The API server will be available at: **http://localhost:5000**  
> Health check endpoint: **http://localhost:5000/api/health**

---

### 3️⃣ Frontend Configuration & Startup

Open a second terminal window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> The web application will launch at: **http://localhost:5173**

---

## 📡 API Documentation

### 🔐 Auth Endpoints (`/api/auth`)
* `POST /api/auth/register` — Create account (`email`, `name`, `password`).
* `POST /api/auth/login` — Sign in and retrieve JWT token.
* `POST /api/auth/demo-login` — 1-click authentication with pre-seeded demo user.

### 🎥 Movie Endpoints (`/api/movies`)
* `GET /api/movies` — Retrieve movie catalog with pagination and query filters:
  * `?search=avatar` (Keyword search)
  * `?status=NOW_PLAYING` (Filter by release state)
  * `?page=1&limit=20` (Pagination control)
* `GET /api/movies/:id` — Detailed record including runtime, TMDB cast credits, and affiliated showtimes.

### 🎪 Showtimes & Seating (`/api/shows`)
* `GET /api/shows/:id` — Show details, screen configuration, and pricing.
* `GET /api/shows/:id/seats` — Layout representation with live state for each seat:
  * `isReserved`: Permanently booked in database.
  * `isLocked`: Temporarily held in Redis by any user.
  * `isLockedByMe`: Held specifically by the requesting user.

### 💳 Booking Flow (`/api/bookings`)
* `POST /api/bookings/lock-seats` — Lock 1 to 6 seats in Redis for 300 seconds:
  ```json
  {
    "showId": "show-uuid",
    "seatIds": ["seat-1", "seat-2"],
    "userId": "user-uuid"
  }
  ```
* `POST /api/bookings/confirm` — Execute database transaction to permanently book locked seats:
  ```json
  {
    "showId": "show-uuid",
    "seatIds": ["seat-1", "seat-2"],
    "userId": "user-uuid",
    "paymentMethod": "CARD"
  }
  ```
* `POST /api/bookings/release-seats` — Release locks early if user cancels.
* `GET /api/bookings/:id` — Fetch complete booking receipt with verified QR hash.
* `GET /api/bookings/user/:userId` — Fetch all bookings for a user profile.

---

## 📜 NPM Scripts Reference

### Backend
| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts server with `nodemon` live-reloading |
| `npm start` | Starts production server |
| `npm run seed` | Seeds theaters, sample movies, and seat grids |
| `npm run db:push` | Syncs Prisma schema with PostgreSQL database |
| `npm run db:migrate` | Runs database migrations |
| `npm run db:studio` | Opens Prisma Studio GUI in browser |
| `npm run db:reset` | Resets database and re-applies migrations |

### Frontend
| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local dev server with hot reload |
| `npm run build` | Compiles TypeScript and creates optimized production bundle |
| `npm run preview` | Previews production build locally |

---

## 🛡️ Security & Reliability Best Practices
- **Password Hashing**: Bcrypt with 12 salt rounds protects all stored credentials.
- **Stateless Authorization**: Signed JWT tokens with 7-day expiration.
- **SQL Injection Prevention**: Prisma ORM parameterized queries eliminate SQL injection vulnerabilities.
- **Race Condition Immunity**: Database transactions verify seat availability at execution time inside `prisma.$transaction()`.
- **Fault-Tolerant Fallbacks**:
  - Redis connection drop $\rightarrow$ In-memory Map store takes over TTL tracking automatically.
  - PostgreSQL downtime $\rightarrow$ Built-in local persistence engine services requests without throwing 500 errors.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/ShivamChaturvedi54">Shivam Chaturvedi</a></sub>
</div>
