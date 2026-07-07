# Copilot Instructions

## Core working rules

- Before writing any code, spend time understanding the existing implementation and reuse it whenever possible instead of introducing new patterns.
- Always inspect all files related to the feature before making edits (such as Components, Hooks, Tests, Types, API, Utils, shared helpers, and configuration when applicable).
- Search for existing utilities, hooks, components, helpers, and abstractions before creating new ones.
- Prefer extending existing abstractions over introducing duplicated logic.
- Prefer small, targeted changes that preserve existing behavior.
- Minimize the size of the diff. Change only what is necessary to accomplish the task.
- When multiple implementation options exist, choose the one that best matches the existing codebase rather than the most novel solution.
- Match the surrounding coding style. Prefer consistency over personal preference.
- Do not introduce new architecture or package boundaries unless explicitly requested.
- Keep the project working and avoid leaving the workspace in a broken state.
- Do not use TypeScript's `any` type anywhere in code or tests.
- Do not leave unresolved errors, warnings, or TODOs that can be handled immediately.
- If a task is split into steps, complete them in order and report progress clearly.
- Unless explicitly requested, do not continue work from previous prompts once a new task has been assigned.
- Never infer additional requirements. Implement only what the user explicitly requested, unless clarification is required to complete the task correctly.

## Task priority

- Treat the latest user task as the highest priority, even if it differs from or replaces a previously discussed approach.
- If the latest task changes the direction of the work, immediately stop pursuing the previous approach and focus entirely on the new task.
- Do not continue implementing previous ideas, plans, or assumptions unless the user explicitly asks you to.
- When the new task conflicts with earlier instructions, follow the user's latest request and adapt the implementation accordingly.
- If the new request would break the project or contradict a non-negotiable project constraint, explain the conflict and propose the closest valid solution instead of ignoring the new request.
- Do not mix multiple tasks unless the user explicitly requests them to be combined.
- Stay focused on the requested task and avoid making unrelated improvements, refactors, or optimizations unless explicitly requested.

## Todo workflow

- When working on a multi-step task, use a todo list and update it as work progresses.
- Mark each todo item as completed as soon as its work is finished.
- Do not claim a task is complete unless it has been verified with a real check or test.
- After finishing a task, explicitly state what was completed and what evidence supports it.

## Implementation guidelines

- Consider edge cases before implementing.
- Handle invalid input.
- Handle empty states.
- Handle loading states.
- Handle error states.
- Explain why each code change is necessary, especially when modifying existing behavior, refactoring code, or making architectural decisions.
- Reuse existing patterns before introducing new ones.
- Prefer readability and maintainability over clever or overly complex solutions.

## Verification before completion

- Before saying a task is done, run the relevant verification command.
- Use fresh evidence from tests, typecheck, lint, or build output.
- If verification cannot be completed, state the limitation clearly instead of pretending it passed.

## Error handling

- Fix the root cause rather than hiding symptoms.
- Do not suppress errors using `eslint-disable`, `@ts-ignore`, or similar workarounds unless explicitly justified.
- Do not leave the workspace with failing checks unless the limitation is clearly explained.
- If a change introduces a problem, revert or correct it before moving on.

## Code quality rules

- Avoid console logs in production code unless specifically requested.
- Avoid unused imports, variables, functions, or dead code.
- Keep imports, formatting, and file organization consistent with the repository style.
- Prefer explicit, strongly-typed interfaces and types over broad shortcuts.
- Do not use `any`; prefer `unknown`, `Record<string, unknown>`, or concrete types.
- Keep functions focused and avoid unnecessary complexity.
- Remove obsolete code when it is no longer needed.

## Performance

- Avoid unnecessary renders.
- Avoid unnecessary allocations.
- Reuse existing memoization patterns where appropriate.
- Avoid unnecessary network requests or expensive computations.
- Avoid premature optimization, but preserve existing performance characteristics.

## Security

- Never expose secrets, credentials, API keys, or private tokens.
- Validate all user input.
- Escape or sanitize untrusted data where appropriate.
- Avoid SQL injection, XSS, command injection, path traversal, and similar security risks.
- Follow the project's existing authentication and authorization patterns.

## Testing

- Update existing tests when behavior changes.
- Add tests for new behavior when appropriate.
- Do not remove or weaken tests simply to make them pass.
- Keep test style consistent with the existing test suite.

## Documentation

- Update relevant documentation when changing public APIs, configuration, behavior, or developer workflows.
- Keep comments concise and synchronized with the implementation.
- Remove outdated comments and documentation.

## Project-specific guidance

- Preserve the existing monorepo structure and workspace boundaries.
- Keep TypeScript config changes minimal and aligned with the current shared-config approach.
- Respect package-layer boundaries and do not move code across layers unless asked.
- When updating plans or phase docs, reflect the actual verified state of the repository.
