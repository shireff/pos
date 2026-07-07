# @packages/domain-billing

Pure domain entities, value objects, and events for the **billing** bounded context.

This module owns subscription lifecycle, trial handling, entitlement resolution, and write-lock rules. It is used by licensing workflows, paywall enforcement, and backend billing operations without coupling to transport or storage concerns.

## Contents

- subscription aggregate and billing lifecycle transitions
- subscription plan and license key entities
- entitlement and lock domain services
- domain events for trial, activation, past due, and lock states
