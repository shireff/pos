# @packages/domain-identity

Pure domain entities, value objects, and events for the **identity** bounded context.

This module contains the core tenant identity concepts used by authentication, RBAC, device registration, and organizational access control. The model is intentionally framework-agnostic and is designed for use by application services, API handlers, and offline-capable clients.

## Contents

- aggregates for company, branch, user, and device lifecycle
- entities for permissions, roles, and user-to-branch assignments
- value objects for permission codes, shift windows, and device fingerprints
- domain events that describe authentication and permission changes
