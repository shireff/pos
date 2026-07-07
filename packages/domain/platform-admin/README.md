# @packages/domain-platform-admin

Pure domain entities, value objects, and events for the **platform-admin** bounded context.

This module encapsulates vendor-side administration capabilities such as tenant plan changes, suspension, override grants, and audit actions. It remains separate from tenant identity to enforce strict access boundaries and support tenant isolation.

## Contents

- platform admin user aggregate
- append-only action entity and tenant override value object
- domain services for guard and action recording
- domain events for account lifecycle and tenant admin actions
