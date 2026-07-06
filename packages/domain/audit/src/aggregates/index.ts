// Audit context has no mutable aggregate root — audit_entries is a pure append-only log.
// The AuditEntry entity (entities/index.ts) is the only domain object needed.
// This file intentionally re-exports from entities for barrel convenience.
export { AuditEntry } from '../entities';
