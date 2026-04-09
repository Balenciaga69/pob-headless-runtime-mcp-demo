# AGENTS

## Project Identity

`pob-headless-runtime-mcp-demo` is a local MCP wrapper around the sibling `pob-headless-runtime` repository.

It is not the runtime itself.
It is not a new contract definition layer.
It is not a standalone Path of Building implementation.

Its job is narrow:

- boot an MCP server
- keep a persistent PoB worker session alive
- expose the stable runtime surface as MCP tools
- keep tool registration, request validation, and worker transport predictable

If a change makes this repo invent new business logic, duplicate runtime rules, or drift away from the stable runtime contract, that change is probably wrong.

## Host Assumptions

This project is tightly coupled to a sibling checkout layout:

```text
PathOfBuilding-Headless/
├─ src/
├─ runtime/
├─ pob-headless-runtime/
└─ pob-headless-runtime-mcp-demo/
```

Current environment resolution lives in:

- `src/config/env.ts`
- `src/worker/processConfig.ts`

Do not weaken these checks.
If the host layout is wrong, fail early with a clear error instead of trying to guess.

## Architecture Map

The codebase has a simple boundary stack. Keep it that way.

1. `src/index.ts`
   Boots stdio MCP transport and HTTP MCP transport.

2. `src/mcp/`
   Owns server creation, tool registration, and MCP-specific response shaping.

3. `src/tools/`
   Owns MCP tool names, descriptions, input schemas, and the mapping from tool call to service call.

4. `src/services/`
   Owns use-case level operations over the worker.
   This layer decides whether a call is persistent-session or transient one-shot.

5. `src/worker/`
   Owns worker process boot, request envelopes, response parsing, and runtime transport details.

6. `src/config/`
   Owns environment parsing and path resolution.

Keep each layer thin.
Do not skip layers just because the call path looks short.

## Source of Truth Rules

This repo mirrors the stable surface of `pob-headless-runtime`.
That means:

- tool names should match the runtime method names
- external MCP params should follow the runtime contract naming, usually `snake_case`
- descriptions should explain behavior, not redefine it differently from upstream

When the sibling runtime adds or changes a stable method, update this demo by tracing the same order:

1. service wrapper
2. tool registration
3. tests
4. README or CHANGELOG if public behavior changed

Do not add local aliases unless there is a strong MCP-specific reason.
Avoid creating two names for the same underlying capability.

## Design Rules

### MCP tools stay declarative

Tool files should do only three things:

- declare the tool name
- validate input with Zod
- delegate to a service

Do not put runtime orchestration, branching logic, or worker parsing into tool files.

### Services own use-case intent

Service files are the right place to decide:

- persistent session vs transient request
- request method and payload shape
- whether the feature is read-only, mutating, or isolated

If a feature touches build state and should persist for later calls, route it through the persistent worker.
If a feature is intentionally isolated and must not mutate the current session, route it through a transient or explicit preview path.

### Worker code owns transport details

Anything about:

- process spawning
- stdout/stderr handling
- timeouts
- request ids
- JSON line parsing
- runtime environment variables

belongs in `src/worker/`, not in `src/services/` or `src/tools/`.

### Stdout is reserved

This project must not write arbitrary logs to stdout.
MCP traffic and worker JSON lines depend on clean streams.

Use `console.error(...)` for diagnostics.
Do not introduce `console.log(...)` in server or worker paths.

## Where To Put Future Changes

Use this placement rule when adding or changing features.

### New stable runtime tool

Touch, in order:

- `src/services/...`
- `src/tools/...`
- `src/mcp/registerTools.ts` only if a new tool group file is added
- `tests/registerTools.test.ts` or new targeted tests

If the feature is item-related but read-only preview, do not force it into the same bucket as permanent mutation unless the user-facing concept is still clearly “equipment”.

### Input normalization or validation

Prefer a focused helper like `src/tools/build/loadBuildInput.ts`.
Keep normalization pure and testable.

### Worker protocol changes

Touch:

- `src/worker/requests.ts`
- `src/worker/response.ts`
- `src/worker/schemas.ts`
- `src/worker/types.ts`

Do not spread protocol parsing logic across services.

### Environment or host-layout changes

Touch:

- `src/config/env.ts`
- `src/worker/processConfig.ts`

Do not duplicate path resolution elsewhere.

## Quality Bar

Every change should satisfy these rules.

- Prefer narrow helpers over large utility buckets.
- Keep functions single-purpose.
- Validate external inputs at the boundary.
- Keep types explicit when the shape matters.
- Reuse worker envelope helpers instead of building raw JSON ad hoc.
- Fail with specific messages when the host layout or worker boot is invalid.
- Do not silently swallow worker failures.
- Keep naming consistent with upstream runtime terminology.

## What Not To Break

The most fragile parts of this repo are:

- persistent worker lifecycle in `src/worker/persistentClient.ts`
- host path resolution in `src/config/env.ts`
- the split between persistent and transient requests
- MCP tool naming consistency

Be careful with these invariants:

- tools that operate on the current session must keep using the persistent worker
- isolated summary behavior must remain isolated
- HTTP and stdio transports should expose the same tool surface
- worker request timeout behavior must remain predictable

## Testing Expectations

Before considering a change complete, run the checks that match the edit.

- `npm run build`
- `npm run test:unit`
- `npm run test:worker` when the change affects the worker path or runtime integration

If you add or change a tool, add or update at least one test near the purest boundary you can reach.
Prefer testing:

- input resolution helpers
- response parsing
- process config shaping
- tool registration coverage

Do not default to heavy end-to-end coverage for every change if a pure boundary test is enough.

## Project Limits

This repo currently has only light automated coverage.
That is not permission to code casually.

Known structural limits:

- service files are intentionally thin wrappers, not a domain layer
- tool registration is manual
- worker behavior is coupled to the sibling runtime and host checkout

When improving the repo, reduce drift and duplication.
Do not introduce framework-like abstractions just to hide simple request forwarding.

## AI Change Workflow

If you are an AI agent editing this repository, follow this order.

1. Read `README.md` and this file.
2. Identify whether the requested feature is:
   - runtime diagnostics
   - build load/save
   - read-only session query
   - persistent mutation
   - isolated preview/simulation
3. Find the matching service file first.
4. Add or change the tool schema only after the service call shape is clear.
5. Keep external tool names aligned with upstream stable method names.
6. Add or update tests before finishing.
7. Run the relevant scripts and report what you actually verified.

When in doubt, inspect the sibling `pob-headless-runtime` contract and method shape before inventing local behavior.

## Prompting Notes For Future AI Contributors

Use prompts that preserve the architecture.

Good prompt pattern:

“Add `<stable_method_name>` to the MCP demo by wiring the existing runtime contract through the service layer, exposing one MCP tool with Zod validation, updating focused tests, and keeping stdout clean.”

Bad prompt pattern:

“Refactor this demo to make it more generic and reusable.”

The first keeps the repo aligned with its purpose.
The second usually causes unnecessary abstraction and contract drift.
