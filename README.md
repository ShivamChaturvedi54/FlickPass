<div align="center">

# 🎟️ FlickPass
### *Enterprise-Grade Movie Ticket Booking Platform Powered by Firebase*

[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express 5](https://img.shields.io/badge/Backend-Express%205%20%7C%20Node.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase Firestore](https://img.shields.io/badge/Database-Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Firebase Admin](https://img.shields.io/badge/SDK-Firebase%20Admin%20v12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/docs/admin/setup)

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-concurrency--locking-in-firestore">Concurrency & Locking</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-documentation">API Reference</a> •
  <a href="#-firestore-data-model">Firestore Data Model</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

</div>

## 📌 Overview

**FlickPass** is a modern movie ticket booking platform designed to replicate the reliability, sleek aesthetic, and seat reservation safeguards found in top cinema chains (such as BookMyShow, AMC, and PVR).

The backend is exclusively powered by **Google Firebase / Firestore**:
- **Firestore Collections**: Persistent document storage for movies, theaters, showtimes, seats, bookings, and users.
- **Atomic Two-Phase Locking**: Temporary seat locks managed via Firestore with automated 5-minute lease expirations, preventing double-booking race conditions without requiring external Redis instances.
- **ACID Transactions**: Atomic Firestore transactions (`db.runTransaction`) guaranteeing that seat reservation, user verification, and ticket issuance happen together.
- **Zero-Friction Local Development**: Built-in high-fidelity Firestore emulator fallback that automatically runs out-of-the-box when Firebase Cloud credentials are not yet configured in `.env`.

---

## ⚡ Key Features

### 🎬 Cinematic Client Experience
* **Hero Carousel & Trailer Integration**: Fluid showcase highlighting trending blockbusters with high-definition backdrops, movie ratings, and direct YouTube trailer playback.
* **Smart Catalog & Filter Engine**: Instant search with multi-parameter filtering across genres, language tracks, and release states (*Now Playing* vs. *Upcoming*).
* **Comprehensive Movie Hub**: Dedicated movie detail view displaying synopses, categorized runtimes, TMDB cast and crew portraits, and theater showtime schedules.
* **Interactive Cinema Seat Map**:
  - Curved perspective visualization replicating modern auditoriums.
  - Multi-tier seat layout distinguishing **VIP recliners** from **Standard seating**.
  - Dynamic visual state indicators: `Available`, `Selected`, `Temporarily Locked`, and `Reserved`.
  - Enforced business rules: Maximum of 6 seats per transaction.
* **Live Lock Expiration Timer**: Synchronized 5-minute countdown timer with color-coded warning states that automatically purges locks when abandoned.
* **Slide-out Cart & Itemized Checkout**: Transparent pricing drawer calculating seat category subtotals, GST/convenience fees, and promo calculations.
* **Cryptographic Digital Pass with QR Code**: Instant e-ticket generation featuring cinema location, screen number, show timings, and a unique cryptographic QR pass for ticket verification.
* **Persistent Authentication & Demo Mode**: JWT-based session security with 1-click **Demo Login** (`demo@flickpass.com`) for immediate testing.

---

## 🏗️ System Architecture

FlickPass separates concerns between a reactive Single Page Application (SPA) and an Express 5 REST API backed exclusively by Firebase:

```mermaid
graph TD
    User([Cinema Patron]) -->|HTTPS / Browsing| FE[React 19 + Vite Frontend]
    FE -->|State Management| Zustand[Zustand Stores<br/>Auth & Seat Selection]
    FE -->|Data Sync & Polling| ReactQuery[TanStack Query v5]
    
    ReactQuery -->|REST API / JSON| API[Express 5 Backend Server]
    
    subgraph "Firebase Backend Engine"
        API --> AuthMW[JWT Auth & User Service]
        API --> MovieCtrl[Movies Controller]
        API --> ShowCtrl[Shows Controller]
        API --> BookingCtrl[Booking & Lock Controller]
        
        BookingCtrl --> FSLock[Firestore Seat Locks Collection<br/>5-Minute TTL Leases]
        BookingCtrl --> FSTransaction[Firestore Atomic Transactions<br/>db.runTransaction]
        
        MovieCtrl --> FSMovies[(Firestore Movies Collection)]
        ShowCtrl --> FSShows[(Firestore Shows Collection)]
        ShowCtrl --> FSSeats[(Firestore Seats Collection)]
        BookingCtrl --> FSBookings[(Firestore Bookings Collection)]
        AuthMW --> FSUsers[(Firestore Users Collection)]
    end
```

---

## 🔒 Concurrency & Locking in Firestore

Preventing seat overlap is the most vital engineering aspect of FlickPass. The platform utilizes a **Two-Phase Reservation Pattern** built on Firestore:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as User A (Alice)
    actor Bob as User B (Bob)
    participant API as FlickPass API
    participant FS_Locks as Firestore seat_locks (TTL: 300s)
    participant FS_DB as Firestore seats & bookings

    Alice->>API: POST /api/bookings/lock-seats (Seats: A1, A2)
    API->>FS_DB: Check seats isReserved status
    API->>FS_Locks: Verify no active lock lease exists
    API->>FS_Locks: Write lock records (expiresAt: now + 300s, userId: Alice)
    API-->>Alice: 200 OK (Seats locked for 5 minutes)

    Bob->>API: POST /api/bookings/lock-seats (Seats: A2, A3)
    API->>FS_Locks: Check lock lease for A2
    Note over API,FS_Locks: A2 is held by Alice (active lease)
    API-->>Bob: 409 Conflict ("Seat A2 is temporarily locked")

    Alice->>API: POST /api/bookings/confirm (Payment Confirmed)
    API->>FS_DB: db.runTransaction: Verify seats -> Mark isReserved -> Write booking
    API->>FS_Locks: Delete lock records
    API-->>Alice: 200 OK (Booking Confirmed + QR Ticket)
```

1. **Phase 1: Temporary Lock**:
   - The user selects 1–6 seats and requests a lock.
   - The backend checks Firestore to verify that none of the seats are permanently reserved (`isReserved: false`) and none have an active lock held by another user in `seat_locks`.
   - Lock documents are recorded in Firestore with an `expiresAt` timestamp set to 300 seconds (5 minutes) into the future.
2. **Phase 2: Atomic Commitment**:
   - The user proceeds to checkout.
   - When the user confirms booking, the backend runs a Firestore atomic transaction (`db.runTransaction`).
   - Inside the transaction, the seats are re-verified, marked permanently reserved (`isReserved: true`), the booking document is created, and the temporary lock records are removed.

---

## 🛠️ Tech Stack

### Frontend Architecture
* **Core**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Lucide React icons
* **State Management**: Zustand
* **Server State**: TanStack React Query v5
* **Routing**: React Router v7

### Backend Architecture (Firebase Only)
* **Runtime**: Node.js, Express 5
* **Database & Cloud**: Google Firebase Admin SDK v12, Firebase Cloud Firestore
* **Security & Auth**: JSON Web Tokens (JWT), bcryptjs
* **QR Generation**: QRCode SVG & SHA-256 digests
* **Dev Server**: Nodemon

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ShivamChaturvedi54/FlickPass.git
cd FlickPass

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```

To connect to your live Firebase Cloud project, set the following in `backend/.env`:
```env
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
> **Note**: If you leave the Firebase credentials blank, FlickPass automatically runs in **Firestore emulation mode** with zero setup required, persisting catalog data and bookings locally.

### 3. Seed Database
```bash
cd backend
npm run seed
cd ..
```
Populates Firestore with:
- 16 movies (10 Now Playing with trailers and cast, 6 Upcoming)
- 5 premium theaters across major cities
- 280 showtimes
- Over 30,000 auditorium seats

### 4. Run Locally
Start both backend and frontend concurrently:
```bash
npm run dev
```

* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`
* **Health Check**: `http://localhost:5000/api/health`

---

## 📡 API Documentation

### 🔐 Auth (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Log into existing user account |
| `POST` | `/api/auth/demo-login` | 1-click instant login (`demo@flickpass.com`) |

### 🎬 Movies (`/api/movies`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/movies` | List movies with pagination, search, and status filters |
| `GET` | `/api/movies/:id` | Get movie details, cast, director, and active showtimes |

### 🎟️ Shows & Seats (`/api/shows`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/shows/:id` | Get showtime details |
| `GET` | `/api/shows/:id/seats` | Get seating layout, category pricing, and lock status |

### 📦 Bookings (`/api/bookings`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/bookings/lock-seats` | Lock 1–6 seats for 5 minutes |
| `POST` | `/api/bookings/confirm` | Confirm booking with atomic transaction |
| `POST` | `/api/bookings/release-seats`| Release temporary seat locks |
| `GET` | `/api/bookings/:id` | Retrieve booking details with QR pass |
| `GET` | `/api/bookings/user/:userId`| Retrieve user's booking history |

---

## 🗄️ Firestore Data Model

The database is organized into the following Firestore collections:

* **`movies`**: Title, poster, backdrop, overview, duration, genres, release date, director, cast, status (`NOW_PLAYING` / `UPCOMING`).
* **`theaters`**: Name, location, total screens.
* **`shows`**: Movie reference, theater reference, start/end timestamps, screen number, pricing tiers (`STANDARD`, `VIP`).
* **`seats`**: Show ID, row label, seat number, category (`STANDARD` / `VIP`), reservation flag (`isReserved`).
* **`seat_locks`**: Temporary locks indexed by `${showId}_${seatId}` with `userId`, `lockedAt`, and `expiresAt` timestamps.
* **`bookings`**: User ID, show details, seat details, total amount, status (`CONFIRMED`), and cryptographic QR payload.
* **`users`**: Email, name, password hash, created timestamp.

---

## 🌐 Deployment to Vercel

The repository is configured as a single Vercel project:

1. Import the repository into [Vercel](https://vercel.com/).
2. Keep the **Root Directory** as the root `./`.
3. In Project Settings > Environment Variables, configure:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `JWT_SECRET`
4. Deploy! Vercel serves the static Vite frontend from `frontend/dist` and routes `/api/*` to the Express backend serverless function.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
