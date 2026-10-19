import { mod, shift } from "./platform";
import { msg, type Message } from "../i18n";

export interface Shortcut {
  keys: string[];
  description: Message;
}

export interface ShortcutCategory {
  title: Message;
  shortcuts: Shortcut[];
}

export const shortcutCategories: ShortcutCategory[] = [
  {
    title: msg("Navigation"),
    shortcuts: [
      { keys: [mod, "P"], description: msg("Command palette") },
      { keys: [mod, "G"], description: msg("Go to note") },
      { keys: [mod, shift, "F"], description: msg("Search notes") },
      { keys: [mod, "\\"], description: msg("Toggle sidebar") },
      { keys: [mod, ","], description: msg("Settings") },
      { keys: [mod, "/"], description: msg("Keyboard shortcuts") },
      { keys: [mod, "W"], description: msg("Close window") },
      { keys: [mod, "="], description: msg("Zoom in") },
      { keys: [mod, "-"], description: msg("Zoom out") },
      { keys: [mod, "0"], description: msg("Reset zoom") },
      { keys: [mod, "["], description: msg("Navigate back") },
      { keys: [mod, "]"], description: msg("Navigate forward") },
    ],
  },
  {
    title: msg("Notes"),
    shortcuts: [
      { keys: [mod, "N"], description: msg("New note") },
      { keys: [mod, "D"], description: msg("Duplicate note") },
      { keys: [mod, "R"], description: msg("Reload note") },
      { keys: ["Delete"], description: msg("Delete note") },
      { keys: [mod, "Backspace"], description: msg("Delete note") },
      { keys: ["↑", "↓"], description: msg("Navigate notes") },
      { keys: ["Enter"], description: msg("Focus editor") },
      { keys: ["Esc"], description: msg("Back to note list") },
    ],
  },
  {
    title: msg("Editor"),
    shortcuts: [
      { keys: [mod, "B"], description: msg("Bold") },
      { keys: [mod, "I"], description: msg("Italic") },
      { keys: [mod, "K"], description: msg("Add / edit link") },
      { keys: [mod, "F"], description: msg("Find in note") },
      { keys: [mod, shift, "C"], description: msg("Copy & Export") },
      { keys: [mod, shift, "P"], description: msg("Print / Export as PDF") },
      { keys: [mod, shift, "M"], description: msg("Markdown source") },
      { keys: [mod, shift, "Enter"], description: msg("Focus mode") },
      { keys: ["/"], description: msg("Slash commands") },
    ],
  },
  {
    title: msg("Settings"),
    shortcuts: [
      { keys: [mod, "1"], description: msg("General") },
      { keys: [mod, "2"], description: msg("Appearance") },
      { keys: [mod, "3"], description: msg("Shortcuts") },
      { keys: [mod, "4"], description: msg("About") },
    ],
  },
  {
    title: msg("Markdown Syntax"),
    shortcuts: [
      { keys: ["#"], description: msg("Heading 1") },
      { keys: ["##"], description: msg("Heading 2") },
      { keys: ["###"], description: msg("Heading 3") },
      { keys: ["**bold**"], description: msg("Bold text") },
      { keys: ["*italic*"], description: msg("Italic text") },
      { keys: ["~~text~~"], description: msg("Strikethrough") },
      { keys: ["==text=="], description: msg("Highlight") },
      { keys: ["-"], description: msg("Bullet list") },
      { keys: ["1."], description: msg("Numbered list") },
      { keys: ["- [ ]"], description: msg("Task list") },
      { keys: [">"], description: msg("Blockquote") },
      { keys: ["`code`"], description: msg("Inline code") },
      { keys: ["```"], description: msg("Code block") },
      { keys: ["---"], description: msg("Horizontal rule") },
      { keys: ["[text](url)"], description: msg("Link") },
      { keys: ["[[Note]]"], description: msg("Wikilink") },
      { keys: ["![alt](url)"], description: msg("Image") },
      { keys: ["| | |"], description: msg("Table") },
      { keys: ["$...$"], description: msg("Inline math") },
      { keys: ["$$...$$"], description: msg("Block math") },
      { keys: ["```mermaid"], description: msg("Mermaid diagram") },
    ],
  },
];
