export interface NoteMetadata {
  id: string;
  title: string;
  preview: string;
  modified: number;
}

export type AttachmentKind = "image" | "pdf" | "text" | "file";

export interface AttachmentMetadata {
  id: string;
  name: string;
  path: string;
  extension: string;
  kind: AttachmentKind;
  modified: number;
  size: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  path: string;
  modified: number;
  /** Content revision is present for standalone optimistic-concurrency saves. */
  revision?: string;
}

export interface ThemeSettings {
  mode: "light" | "dark" | "system";
}

export type FontFamily = "system-sans" | "serif" | "monospace";
export type TextDirection = "auto" | "ltr" | "rtl";
export type EditorWidth = "narrow" | "normal" | "wide" | "full" | "custom";
export type PasteMode = "markdown" | "plain" | "code-block";
export type NoteSortOrder = "newest" | "oldest";

export interface EditorFontSettings {
  baseFontFamily?: FontFamily;
  baseFontSize?: number; // in px, default 16
  boldWeight?: number; // 600, 700, 800 for headings and bold text
  lineHeight?: number; // default 1.6
}

// Customizable theme color keys (maps to CSS --color-* variables)
export type ThemeColorKey =
  | "bg"
  | "bg-secondary"
  | "bg-muted"
  | "bg-emphasis"
  | "text"
  | "text-muted"
  | "border"
  | "accent"
  | "selection";

// Partial map of color overrides (hex strings)
export type CustomColors = Partial<Record<ThemeColorKey, string>>;

// Per-folder settings (stored in .ratura/settings.json)
export interface Settings {
  theme: ThemeSettings;
  editorFont?: EditorFontSettings;
  gitEnabled?: boolean;
  foldersEnabled?: boolean;
  sidebarSortOrder?: NoteSortOrder;
  pinnedNoteIds?: string[];
  textDirection?: TextDirection;
  spellCheckEnabled?: boolean;
  autoCorrectEnabled?: boolean;
  editorWidth?: EditorWidth;
  customEditorWidthPx?: number;
  editorWidthResizeEnabled?: boolean;
  editorToolbarVisible?: boolean;
  titleBarModifiedDateVisible?: boolean;
  titleBarFilenameVisible?: boolean;
  sidebarWidthPx?: number;
  defaultNoteName?: string;
  interfaceZoom?: number;
  ollamaModel?: string;
  ignoredPatterns?: string[];
  customColorsLight?: CustomColors;
  customColorsDark?: CustomColors;
  pasteMode?: PasteMode;
}

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  notes: NoteMetadata[];
  attachments: AttachmentMetadata[];
}
