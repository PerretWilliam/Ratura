# Changelog

All notable changes to Ratura are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

Each release's notes on GitHub are taken from its section below, so add a section for the new version before bumping it.

## [1.2.1] - 2026-10-19

### Changed
- Dragging a block now outlines the whole block, shows a preview of it under the pointer and keeps the grabbing cursor until you drop it. Hovering the grip outlines the block it will move. Releasing the block over itself leaves it in place.
- The + next to the grip adds the new block below instead of above.

### Fixed
- Translated the texts that were still in English: AI edit, update notice, Git and CLI settings, table colors, pin and delete menus, and a few tooltips.

## [1.2.0] - 2026-10-19

### Added
- Language picker in Settings → General, with flags and how complete each translation is. Ratura is available in English, French, German, Spanish, Italian, Brazilian Portuguese, Dutch, Polish, Turkish, Russian, Ukrainian and Japanese; "System" follows the OS language.
- Rename notes from the title above the note or with Rename in the note menus.

### Changed
- A note's name is now its file name instead of its first line, and editing the first line no longer renames the file. New notes start empty and imported files keep their name.

### Fixed
- Creating or duplicating a note whose name was already taken could retry the same file forever.

## [1.1.0] - 2026-10-19

### Added
- Custom CSS in Settings → Appearance, applied live on top of the app styles to make your own theme.

### Fixed
- Scrolling stuttered on long notes with large tables (for example full of math): table controls no longer measure every table on each scroll frame.

## [1.0.1] - 2026-10-18

### Added
- "Restart now" button once an update has been installed from the app.

### Changed
- The mouse is Ratura's mascot: new app icon on every platform, README logo, and empty-state illustrations.

### Fixed
- Even top and bottom padding on the sidebar "Notes" header.
- Release builds failed because the Tauri npm packages and Rust crates had drifted apart; they are aligned and pinned to the same minor versions.

### Security
- All `npm audit` vulnerabilities fixed (61, including 8 high): TipTap 3.32, KaTeX 0.18.11, Vite 7.3.4, Vitest 4.1.12 and patched transitive dependencies.

## [1.0.0] - 2026-10-18

First Ratura release, forked from [Scratch](https://github.com/erictli/scratch) 1.0.0 by Eric Li, with open community pull requests integrated.

### Added
- Multiple windows and workspaces: one notes folder per window, a workspace switcher, and per-window session restore ([#197](https://github.com/erictli/scratch/pull/197) by @Norkep).
- Standalone Markdown windows for files opened outside a workspace, and direct Settings access ([#200](https://github.com/erictli/scratch/pull/200) by @Norkep).
- Browser-like back/forward navigation history ([#183](https://github.com/erictli/scratch/pull/183) by @dalelane).
- `Cmd+G` to jump to a note ([#186](https://github.com/erictli/scratch/pull/186) by @dalelane).
- Sidebar sorting options and folder collapse controls ([#198](https://github.com/erictli/scratch/pull/198) by @Norkep).
- Selection formatting menu (text styles, colours, highlight, sub/superscript, links) and improved tables ([#201](https://github.com/erictli/scratch/pull/201) by @Norkep).
- Drag and drop of editor blocks ([#203](https://github.com/erictli/scratch/pull/203) by @Norkep, partial).
- Drag and drop of images between blocks ([#202](https://github.com/erictli/scratch/pull/202) by @Norkep, partial).
- `==text==` highlighting ([#214](https://github.com/erictli/scratch/pull/214) by @Kobe-Vandenberghe).
- Inline KaTeX math with `$...$` ([#167](https://github.com/erictli/scratch/pull/167) by @PerretWilliam).
- GitHub-style alert blockquotes such as `> [!TIP]` ([#174](https://github.com/erictli/scratch/pull/174) by @dirlligafu).
- Easier code block creation ([#205](https://github.com/erictli/scratch/pull/205) by @shilohlee98).
- Attachment previews and file type icons ([#153](https://github.com/erictli/scratch/pull/153) by @IntoTheBlueAt).
- Copy as plain text or markdown ([#193](https://github.com/erictli/scratch/pull/193) by @Oguzhan-Ozpinar).
- Configurable paste mode ([#162](https://github.com/erictli/scratch/pull/162) by @TumGovic).
- Editor display and title bar settings ([#199](https://github.com/erictli/scratch/pull/199) by @Norkep).
- Spell check and autocorrect settings ([#206](https://github.com/erictli/scratch/pull/206) by @shilohlee98).
- Custom git commit messages ([#157](https://github.com/erictli/scratch/pull/157) by @eclairjit).
- Signed in-app updates from Ratura's own releases.

### Changed
- Renamed from Scratch to Ratura: app name, bundle id `io.github.perretwilliam.ratura`, config folder, and per-folder settings in `.ratura/` (existing `.scratch/settings.json` is picked up).
- Ollama is called through its HTTP API instead of the CLI ([#195](https://github.com/erictli/scratch/pull/195) by @tilhammer).

### Fixed
- Unresponsive window controls on Linux, by forcing the XWayland backend ([#182](https://github.com/erictli/scratch/pull/182) by @GihanRathnayake).
- The paste mode setting is now saved.

[1.0.1]: https://github.com/PerretWilliam/Ratura/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/PerretWilliam/Ratura/releases/tag/v1.0.0
