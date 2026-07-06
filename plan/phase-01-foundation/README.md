# Phase 01 — Foundation

## Purpose

Establish the complete project skeleton with enforced architecture boundaries, shared-kernel value objects, MongoDB local database with field-level encryption, backup infrastructure, and both app shells (Tauri + Capacitor) booting against the local DB. No business feature is built here — but every architectural guarantee is proven before any feature is built on top.

## Scope

- Monorepo scaffold (pnpm workspaces), CI pipeline, TypeScript strict mode, lint rules
- Layer-boundary lint enforcement (Domain/Application cannot import Infrastructure/React/Tauri/Capacitor)
- `shared-kernel` package: Money, DateTime, Identifiers (UUIDv7), Result type, DomainEventBase, HLC clock
- MongoDB embedded local database with libmongocrypt field-level encryption + OS keystore
- Migration runner (versioned, idempotent, identical across local MongoDB and server PostgreSQL)
- Backup infrastructure scaffold: local disk adapter, Supabase Storage adapter, offline queue, scheduler
- Tauri shell (Desktop) booting against local encrypted MongoDB
- Capacitor shell (Android) booting against local encrypted MongoDB
- Both shells share 95%+ of React app code — only bootstrap/DI wiring differs per shell

## Expected Output

A running monorepo where:

- CI fails on a deliberately introduced cross-layer lint violation
- Both Desktop (Tauri) and Android (Capacitor) shells boot, display a health screen, and confirm local MongoDB is encrypted
- `shared-kernel` value objects are unit-tested (Money arithmetic, HLC ordering, Result type)
- Migration runner applies and rolls back a test migration idempotently
- Local disk backup adapter writes an encrypted compressed snapshot
- Supabase Storage adapter uploads (mocked in CI, real in integration test)

## Documents Referenced

- Architecture.md (all sections)
- Coding_Standards.md (all sections)
- Project_Structure.md (all sections)
- Database.md §8 (migration strategy), §9 (backup architecture)
- Security.md §3.1 (MongoDB encryption at rest)
- Hardware.md §0 (cross-platform access policy)
- Vision.md §5 (offline-first, no vendor lock-in)

## Included Modules

- Monorepo configuration
- `packages/shared-kernel`
- `packages/domain` (scaffold only — zero business logic yet)
- `packages/application` (scaffold only)
- `packages/infrastructure/mongodb` (connection, encryption setup, migration runner)
- `packages/infrastructure/backup` (adapters, queue, scheduler)
- `apps/desktop` (Tauri shell scaffold, DI bootstrap)
- `apps/android` (Capacitor shell scaffold, DI bootstrap)
- `apps/backend` (Node.js scaffold, health endpoint, Docker-compose)
- CI pipeline
