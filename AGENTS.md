# AGENTS.md

## Project Overview
React + TypeScript + Vite app that runs **PHP in the browser via WebAssembly** (`@php-wasm/web-8-4`, `@php-wasm/universal`).

## Key Commands
- use commands in `scripts` section from @package.json

## Architecture Notes
- **PHP Runtime**: PHP8.4, Initialized in `App.tsx` via `loadPHPRuntime()` + `new PHP(runtimeId)`
- **Laravel**: Version 13
- **WASM Loading**: Custom Vite plugin `vite-plugins/force-wasm-url.ts` rewrites `.wasm` imports from `@php-wasm` to use `?url` suffix
- **Path Alias**: `@/*` → `./src/*` (configured in tsconfig + vite.config.ts)
- Do not import anything from `apps/` directory in `src/` folder

## Non-Obvious Gotchas
1. **`@php-wasm/web-8-4` excluded from dep optimization** (`vite.config.ts:24`) — otherwise WASM fails to load
2. **Assets include** `.dat`, `.wasm`, `.so`, `.la` files (`vite.config.ts:22`)
3. **Biome linter disabled** — only formatter runs (`biome.json:21`)
