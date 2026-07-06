# Smart Retail OS

An offline-first, tenant-isolated Smart Retail OS.

## Tech Stack Overview

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript — shared across Desktop and Android
- **Desktop shell**: Tauri (packages the shared Next.js app — no Electron, no native desktop UI)
- **Android shell**: Capacitor (packages the shared Next.js app — no Kotlin/Java UI)
- **Local DB**: MongoDB embedded with field-level encryption via `libmongocrypt`
- **Server DB**: PostgreSQL (cloud relay/reporting)
- **Backend**: Next.js 15 App Router (Route Handlers as REST API)
- **Architecture**: Monorepo using `npm` workspaces, Clean Architecture, DDD, Event Sourcing, CQRS

## Development Setup

### Prerequisites

- Node.js v24+
- npm v10+ (comes with Node.js — no separate install needed)
- Rust / Tauri dependencies (for desktop app)
- Android SDK (for Android app)

### Installation

```bash
npm install
```

### Running the Apps

- **Backend**: `npm run dev --workspace=apps/backend`
- **Desktop**: `npm run dev --workspace=apps/desktop`
- **Android**: `npm run dev --workspace=apps/android`

### Running Tests

```bash
npm test
```

### Formatting and Linting

```bash
npm run lint
npm run typecheck
```

## Folder Structure

- `apps/desktop/` — Tauri shell packaging the shared Next.js app
- `apps/android/` — Capacitor shell packaging the shared Next.js app
- `apps/backend/` — Next.js 15 backend (API Route Handlers)
- `apps/platform-admin/` — Vendor-only admin console (Next.js)
- `packages/shared-kernel/` — Shared Value Objects (Money, DateTime, HLC, Result, etc.)
- `packages/domain/` — Pure domain layer per bounded context
- `packages/application/` — Application use cases per bounded context
- `packages/infrastructure/` — Infrastructure adapters (MongoDB, Backup, Sync Engine, etc.)
- `packages/ui-components/` — Shared Next.js / React UI component library (RTL/LTR aware)
