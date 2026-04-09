# pob-headless-runtime-mcp-demo

`pob-headless-runtime-mcp-demo` is a local MCP server for `pob-headless-runtime`.

It now runs both:

- the original stdio MCP transport
- an HTTP MCP endpoint at `/mcp`

It now uses a persistent PoB worker session, so MCP tools can:

- load a build once
- keep that build in session
- read summary / stats / display stats
- inspect or change config
- inspect or change equipment
- save the modified build back out

## Expected Layout

```text
PathOfBuilding-Headless/
├─ src/
├─ runtime/
├─ pob-headless-runtime/
└─ pob-headless-runtime-mcp-demo/
```

This repository assumes it lives beside `pob-headless-runtime`, inside a compatible host repo that already contains upstream `src/` and `runtime/`.

## Source Layout

```text
src/
├─ config/      # environment and path resolution
├─ mcp/         # MCP server factory and tool registration
├─ scripts/     # local manual test entrypoints
├─ services/    # use-case wrappers over the worker session
├─ tools/       # MCP tool groups
├─ worker/      # worker transport, schemas, requests, and Lua session worker
└─ templates/   # reserved for future templates
```

Current tool grouping:

- `runtimeTools.ts`: hello + runtime diagnostics
- `tools/build/loadTools.ts`: build loading
- `tools/build/readTools.ts`: summary and read-only queries
- `tools/build/configTools.ts`: config mutation
- `tools/build/equipmentTools.ts`: item equip actions
- `tools/build/skillTools.ts`: active skill selection
- `tools/build/saveTools.ts`: build export actions

## Install

```powershell
npm install
```

## Build

```powershell
npm run build
```

Expected output:

- `build/index.js`
- `build/scripts/testWorker.js`

The build script clears old `build/` output first so refactors do not leave stale files behind.

## HTTP Port

The server starts an HTTP MCP endpoint by default:

- host: `127.0.0.1`
- port: `3386`
- path: `/mcp`

Environment overrides:

- `MCP_HTTP_HOST`
- `MCP_HTTP_PORT`
- `MCP_HTTP_PATH`

Example:

```powershell
$env:MCP_HTTP_HOST = "0.0.0.0"
$env:MCP_HTTP_PORT = "3000"
npm run start
```

## Included MCP Tools

Runtime tools:

- `hello_world`
- `runtime_health`
- `runtime_status`

Build tools:

- `load_build`
- `summarize_build`
- `get_stats`
- `get_display_stats`
- `preview_item_display_stats`
- `list_equipment`
- `list_items`
- `list_skills`
- `get_selected_skill`
- `equip_item`
- `select_skill`
- `get_config`
- `set_config`
- `save_build_code`
- `save_build_xml`
- `save_build_file`

## Inspector Validation

Run Inspector:

```powershell
npm run inspect
```

Recommended order:

1. call `hello_world`
2. call `runtime_health`
3. call `load_build`
4. call `summarize_build`
5. call `get_stats`
6. call `get_display_stats`
7. call `preview_item_display_stats`
8. call `list_skills`
9. call `get_selected_skill`
10. call `list_items`

Example `hello_world` input:

```json
{
  "name": "Ray"
}
```

Example `load_build` input with a PoB code:

```json
{
  "build_code": "<your build code>",
  "build_name": "My Build"
}
```

After `load_build`, you can call `summarize_build` with no arguments because the build is already in the worker session:

```json
{}
```

If you pass `build_code` to `summarize_build`, it runs as an isolated one-shot summary and does not overwrite the current session build.

Example `get_stats` input:

```json
{
  "fields": ["TotalDPS", "Life", "EnergyShield"]
}
```

Example `select_skill` input:

```json
{
  "group": 0,
  "skill": 0,
  "part": 0
}
```

Example `preview_item_display_stats` input:

```json
{
  "item_text": "Rarity: Rare\n...",
  "slot": "Ring 1"
}
```

## Manual Worker Check

You can still test the worker outside MCP:

```powershell
$env:POB_BUILD_CODE="<your build code>"
npm run test:worker
```

This script:

- starts the persistent PoB worker
- loads the build code into session
- requests `get_summary`
- prints the result to `stderr`

## Unit Test Readiness

The project is now set up so unit tests can target pure boundaries instead of mocking the whole MCP stack.

Recommended first unit-test targets:

- `src/tools/build/loadBuildInput.ts`
- `src/mcp/toolResult.ts`
- `src/worker/response.ts`
- `src/worker/processConfig.ts`

Run unit tests with:

```powershell
npm run test:unit
```

Notes:

- unit tests should live under `tests/`
- the script compiles tests through `tsconfig.test.json`
- if no `*.test.ts` files exist yet, the script exits cleanly

## VS Code MCP Config

`.vscode/mcp.json` is included already:

```json
{
  "servers": {
    "pob-headless-mcp-demo": {
      "command": "node",
      "args": ["${workspaceFolder}/build/index.js"]
    }
  }
}
```

Recommended flow in VS Code:

1. run `npm run build`
2. open this folder in VS Code
3. run `MCP: List Servers`
4. trust and start `pob-headless-mcp-demo`
5. in Copilot Chat Agent mode, call `runtime_health`
6. then `load_build`
7. then `summarize_build`

Example Agent prompts:

- `Use runtime_health and show me whether the PoB worker is ready.`
- `Use load_build with this build code, then summarize_build.`
- `Use get_stats to fetch TotalDPS and Life from the current build.`

## Environment Variables

Optional overrides:

- `POB_HEADLESS_DIR`
- `POB_HEADLESS_LUA_BIN`
- `POB_HEADLESS_MAX_FRAMES`
- `POB_HEADLESS_MAX_SECONDS`
- `POB_HEADLESS_REQUEST_TIMEOUT_MS`

If `POB_HEADLESS_DIR` is not set, the project defaults to:

- `../pob-headless-runtime`

## Notes About This Design

This repository no longer uses a one-request worker pattern for MCP tools.

It uses a persistent Lua worker session so tools can operate on the same loaded build across multiple MCP calls. That is what makes config mutation, equipment mutation, and save operations practical.

## Validation Status

Validated locally during development:

- `npm run build`
- runtime health through the persistent worker
- load fixture build code
- summarize current build
- fetch raw stats
- fetch display stats
- fetch config
- save build code

Not fully smoke-tested in this repo yet:

- every possible `set_config` combination
- every `equip_item` slot case
- every `save_build_file` path variant

## Important Rule

Do not write to stdout except MCP JSON-RPC traffic or raw worker JSON lines.

For diagnostics in this demo, use `console.error(...)` only.
