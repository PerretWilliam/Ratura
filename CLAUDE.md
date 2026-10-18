# Ratura - Development Guide

## Project Overview

Ratura is a cross-platform markdown note-taking app for macOS, Windows, and Linux, built with Tauri v2 (Rust backend) + React/TypeScript/Tailwind (frontend) + TipTap (WYSIWYG editor) + Tantivy (full-text search).

## Commands

```bash
npm run dev          # Start Vite dev server only
npm run build        # Build frontend (tsc + vite)
npm run tauri dev    # Run full app in development mode
npm run tauri build  # Build production app
```

## CI

Runs on pushes to `main` and `integration` and on every PR (Ubuntu runner): frontend build, vitest, `cargo fmt --check`, `cargo clippy --all-targets -D warnings`, `cargo test`.

## Key Patterns

- All backend operations go through Tauri commands in `src-tauri/src/lib.rs`. Frontend calls them via `invoke()` from `@tauri-apps/api/core`.
- `NotesContext` uses a dual context pattern (data/actions separated) for performance.
- Settings live in two places: app config at `{APP_DATA}/config.json`, per-folder settings at `{NOTES_FOLDER}/.ratura/settings.json`.
- Tauri v2 permissions go in `src-tauri/capabilities/default.json`.

## Coding Conventions

- Clean, minimal code with low technical debt
- Proper React patterns (contexts, hooks, memoization)
- Type-safe with TypeScript throughout
- No commented-out code or TODOs in production code
- Use `React.memo` for expensive list-item components
- Use `useCallback`/`useMemo` for performance-critical paths
- Debounce user-triggered operations (auto-save 300ms, search 150ms, file watcher 500ms, git status 1000ms)
- All operations should be non-blocking (async)
- Error handling with user-friendly messages

## Releasing

1. Bump version in `package.json` and `src-tauri/tauri.conf.json`
2. Merge to `main`: the release workflow sees a version without a tag, builds all platforms, and publishes `vX.Y.Z` with `latest.json` for the updater
3. The updater key lives in `~/.tauri/ratura.key`; the private key is the `TAURI_SIGNING_PRIVATE_KEY` repo secret
