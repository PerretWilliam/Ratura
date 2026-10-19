import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import type { Editor as TiptapEditor } from "@tiptap/core";
import type { ReactNode } from "react";
import {
  PilcrowIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ListIcon,
  ListOrderedIcon,
  CheckSquareIcon,
  QuoteIcon,
  CodeIcon,
  BlockMathIcon,
  SeparatorIcon,
  ImageIcon,
  TableIcon,
  BracketsIcon,
  WorkflowIcon,
} from "../icons";
import { ALERT_TYPES, ALERT_META, type AlertType } from "./AlertBlockquote";
import { t as tNow } from "../../i18n";

const ALERT_ALIASES: Record<AlertType, string[]> = {
  NOTE: ["note", "info"],
  TIP: ["tip", "hint"],
  IMPORTANT: ["important"],
  WARNING: ["warning", "warn"],
  CAUTION: ["caution", "danger"],
};
import { SlashCommandList, type SlashCommandListRef } from "./SlashCommandList";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: ReactNode;
  aliases: string[];
  command: (editor: TiptapEditor) => void;
}

// Built per query so titles follow the current language
const slashCommands = (): SlashCommandItem[] => [
  {
    title: tNow("Text"),
    description: tNow("Plain body text"),
    icon: <PilcrowIcon />,
    aliases: ["paragraph", "body", "plain", "normal"],
    command: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    title: tNow("Heading 1"),
    description: tNow("Large section heading"),
    icon: <Heading1Icon />,
    aliases: ["h1", "heading", "title"],
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: tNow("Heading 2"),
    description: tNow("Medium section heading"),
    icon: <Heading2Icon />,
    aliases: ["h2", "heading", "subtitle"],
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: tNow("Heading 3"),
    description: tNow("Small section heading"),
    icon: <Heading3Icon />,
    aliases: ["h3", "heading"],
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: tNow("Heading 4"),
    description: tNow("Smallest section heading"),
    icon: <Heading4Icon />,
    aliases: ["h4", "heading"],
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 4 }).run();
    },
  },
  {
    title: tNow("Bullet List"),
    description: tNow("Unordered list"),
    icon: <ListIcon />,
    aliases: ["ul", "unordered", "list"],
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: tNow("Numbered List"),
    description: tNow("Ordered list"),
    icon: <ListOrderedIcon />,
    aliases: ["ol", "ordered", "list", "numbered"],
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: tNow("Task List"),
    description: tNow("List with checkboxes"),
    icon: <CheckSquareIcon />,
    aliases: ["todo", "checklist", "checkbox"],
    command: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    title: tNow("Blockquote"),
    description: tNow("Block quotation"),
    icon: <QuoteIcon />,
    aliases: ["quote"],
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  ...ALERT_TYPES.map((type) => {
    const { label, color } = ALERT_META[type];
    return {
      title: tNow("Alert: {label}", { label: tNow(label) }),
      description: tNow("{label} alert callout", { label: tNow(label) }),
      icon: (
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <QuoteIcon />
          <span style={{ position: "absolute", bottom: -2, right: -3, width: 6, height: 6, borderRadius: "50%", background: color }} />
        </div>
      ),
      aliases: [...ALERT_ALIASES[type], "alert", "callout"],
      command: (editor: TiptapEditor) => {
        editor.chain().focus().wrapIn("alertBlockquote", { alertType: type }).run();
      },
    };
  }),
  {
    title: tNow("Code Block"),
    description: tNow("Fenced code block"),
    icon: <CodeIcon />,
    aliases: ["code", "fenced", "pre"],
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: tNow("Mermaid Diagram"),
    description: tNow("Mermaid diagram block"),
    icon: <WorkflowIcon />,
    aliases: ["mermaid", "diagram", "flowchart", "chart"],
    command: (editor) => {
      editor.chain().focus().setCodeBlock({ language: "mermaid" }).run();
    },
  },
  {
    title: tNow("Block Math"),
    description: tNow("Display math block"),
    icon: <BlockMathIcon />,
    aliases: ["math", "equation"],
    command: (editor) => {
      editor.chain().focus().run();
      window.dispatchEvent(new CustomEvent("slash-command-block-math"));
    },
  },
  {
    title: tNow("Inline Math"),
    description: tNow("Inline math expression"),
    icon: <BlockMathIcon />,
    aliases: ["inline math", "latex"],
    command: (editor) => {
      editor.chain().focus().run();
      window.dispatchEvent(new CustomEvent("slash-command-inline-math"));
    },
  },
  {
    title: tNow("Horizontal Rule"),
    description: tNow("Visual divider"),
    icon: <SeparatorIcon />,
    aliases: ["divider", "separator", "hr", "line"],
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    title: tNow("Image"),
    description: tNow("Insert from file"),
    icon: <ImageIcon />,
    aliases: ["picture", "photo", "img"],
    command: (editor) => {
      editor.chain().focus().run();
      window.dispatchEvent(new CustomEvent("slash-command-image"));
    },
  },
  {
    title: tNow("Table"),
    description: tNow("Insert a 3×3 table"),
    icon: <TableIcon />,
    aliases: ["grid"],
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: tNow("Wikilink"),
    description: tNow("Link to another note"),
    icon: <BracketsIcon />,
    aliases: ["link", "note", "wikilink", "[["],
    command: (editor) => {
      editor.chain().focus().insertContent("[[").run();
    },
  },
];

const slashCommandPluginKey = new PluginKey("slashCommand");

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: "/",
        pluginKey: slashCommandPluginKey,
        allowSpaces: false,
        startOfLine: true,

        allow: ({ editor }) => {
          return (
            !editor.isActive("codeBlock") && !editor.isActive("frontmatter")
          );
        },

        items: ({ query }) => {
          const q = query.toLowerCase();
          return slashCommands().filter(
            (item) =>
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.aliases.some((alias) => alias.includes(q)),
          );
        },

        command: ({ editor, range, props: item }) => {
          editor.chain().focus().deleteRange(range).run();
          item.command(editor);
        },

        render: () => {
          let component: ReactRenderer<SlashCommandListRef> | null = null;
          let popup: TippyInstance | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items,
                  command: props.command,
                },
                editor: props.editor,
              });

              popup = tippy(document.body, {
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                offset: [0, 4],
                popperOptions: {
                  modifiers: [
                    {
                      name: "flip",
                      options: { fallbackPlacements: ["top-start"] },
                    },
                  ],
                },
              });
            },

            onUpdate: (props) => {
              component?.updateProps({
                items: props.items,
                command: props.command,
              });

              popup?.setProps({
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
              });
            },

            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                popup?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit: () => {
              popup?.destroy();
              component?.destroy();
              popup = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
