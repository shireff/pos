# Smart Retail OS

An offline-first, tenant-isolated Smart Retail OS.

## Tech Stack Overview

- **Frontend shell**: React, TypeScript, Tauri (Desktop) and Capacitor (Android)
- **Local DB**: MongoDB embedded with field-level encryption via `libmongocrypt`
- **Server DB**: PostgreSQL (cloud relay)
- **Backend core**: Node.js + Express
- **Architecture**: Monorepo using `pnpm` workspaces, Clean Architecture, DDD, Event Sourcing, CQRS

## Development Setup

### Prerequisites

- Node.js v24+
- pnpm (installed globally via `npm install -g pnpm`)
- Rust / Tauri dependencies (for desktop app)
- Android SDK (for Android app)

### Installation

```bash
pnpm install
```

### Running the Apps

- **Backend**: `pnpm --filter @apps/backend dev`
- **Desktop**: `pnpm --filter @apps/desktop dev`
- **Android**: `pnpm --filter @apps/android dev`

### Running Tests

To run all tests:

```bash
pnpm test
```

### Formatting and Linting

```bash
pnpm run lint
pnpm run typecheck
```

## Folder Structure

- `apps/*`: Application shells (Desktop, Android, Backend)
- `packages/shared-kernel/`: Shared Value Objects (Money, DateTime, HLC, Result, etc.)
- `packages/domain/`: Pure domain layer per bounded context
- `packages/application/`: Application use cases per bounded context
- `packages/infrastructure/`: Infrastructure adapters (MongoDB, Backup, Sync Engine, etc.)
- `packages/ui-components/`: Shared React UI library
