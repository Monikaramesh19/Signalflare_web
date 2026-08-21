# SignalFlare — Emergency response logistics platform

> "When the Signal Fails, Help Shouldn't."

SignalFlare is a production-quality, full-stack, offline-first web application designed for emergency rescue coordination and supply management during disasters. It operates seamlessly without network connectivity by caching records locally and synchronizing them automatically using an IndexedDB transaction queue.

---

## 1. System Architecture

```text
SIGNALFLARE
│
├── FRONTEND (client/)
│   ├── React + TypeScript + Vite + Tailwind CSS
│   ├── Leaflet Map Visualizer
│   ├── Recharts Analytics
│   ├── IndexedDB Cache Manager & Sync Queue
│   └── Socket.IO Real-Time Client
│
├── BACKEND (server/)
│   ├── Node.js + Express + TypeScript
│   ├── Prisma ORM + PostgreSQL Database
│   ├── JWT Authenticator & Role Middleware
│   └── Socket.IO Broadcast Server
```

---

## 2. Setup Instructions

### Environment Configuration

Create a `.env` file at the root of the workspace (refer to `.env.example`):

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/signalflare?schema=public"
JWT_SECRET="super-secret-signalflare-jwt-key-2026"
VITE_API_URL="http://localhost:5000/api"
```

### Installation

Install monorepo dependencies:
```bash
npm run install:all
```

### Database Initialization

1. Compile the Prisma client:
   ```bash
   npm run prisma:generate
   ```
2. Execute the migrations to configure tables in PostgreSQL:
   ```bash
   npm run prisma:migrate
   ```
3. Seed default demo data (camps, resources, alerts):
   ```bash
   npm run prisma:seed
   ```

### Booting up the Application

Run both client and server concurrently:
```bash
npm run dev
```
- **Backend Port**: `http://localhost:5000`
- **Frontend Port**: `http://localhost:5173` (Vite)

---

## 3. Preconfigured Demo Accounts

All preloaded accounts share the same credentials password:

**Password**: `password123`

| Role | Account Email | Dashboard View |
| :--- | :--- | :--- |
| **Victim** | `victim@signalflare.demo` | SOS buttons, request supplies form, shelter lookup |
| **Volunteer** | `volunteer@signalflare.demo` | Tasks board, active checklist coordinates |
| **Rescue Responders** | `rescue@signalflare.demo` | Evacuation control center, dispatch assignments |
| **System Admin** | `admin@signalflare.demo` | Audit logs tracker, system health, user index |

---

## 4. Offline-First Flow

1. When connection drops, the navbar indicator switches to `🔴 OFFLINE`.
2. Any SOS triggers or supply requests are stored in the local **IndexedDB** queue.
3. Once connection restores, the status switches to `🟠 SYNCING...`.
4. Cached data packages are uploaded to the backend `/api/sync` pipeline and written to PostgreSQL.
5. Synchronization resolves and returns to `🟢 ONLINE`. No data is ever lost.
