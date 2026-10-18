# Contributing to Ratura

Ratura is a minimalist markdown notes app. It is not trying to become Obsidian or Notion: the small feature set is the point.

## Editorial line

- **Minimalism first.** A feature has to earn its place. Anything visually heavy, always-on, or off-topic for quick note-taking is likely to be declined, or kept behind a setting that is off by default.
- **Plain files stay plain.** Notes are `.md` files the user owns. No hidden formats, no lock-in, no network calls the user did not ask for.
- **Keyboard and speed.** New actions should be reachable from the keyboard and must not slow down typing, opening or searching notes.

## Pull requests

- **Small and focused.** One fix or one feature per PR. Split refactors from behaviour changes. Large architectural changes: open an issue first.
- **Explain the why.** Say what problem it solves and how you tested it; add a screenshot for UI changes.
- **Tests are required.** Add or update a test for any logic you change, and make sure everything passes before asking for review:

  ```bash
  npm run build                            # tsc + vite
  cd src-tauri && cargo test && cargo clippy -- -D warnings
  ```

- **Follow the existing code.** Match the patterns in [CLAUDE.md](CLAUDE.md): Tauri commands in `src-tauri/src/lib.rs`, context-based state, no commented-out code or TODOs.
- **Keep authorship.** We merge or cherry-pick your commits as they are, so write clear commit messages (`feat:`, `fix:`, `chore:`…).

## License

By contributing, you agree that your contributions are released under the [MIT License](LICENSE).
