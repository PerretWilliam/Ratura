import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { NodeSelection, type EditorState } from "@tiptap/pm/state";
import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BoldIcon,
  CheckIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  StrikethroughIcon,
} from "../../icons";
import {
  HIGHLIGHT_COLOR_OPTIONS,
  TEXT_COLOR_OPTIONS,
} from "./markdownMarks";
import {
  getTableBlockHandleReferenceRect,
  getTopLevelBlockDragTargetFromDom,
  hasExceededBlockPointerDragThreshold,
  isCurrentMovableBlockDragTarget,
  isTableBlockHandleProximity,
  moveBlockByKeyboard,
  moveBlockAtPoint,
  resolveBlockDropTarget,
  type BlockDragTarget,
} from "./blockDrag";
import { getInterfaceZoom } from "./interfaceGeometry";
import { msg, useT } from "../../../i18n";

interface SelectionMenuProps {
  editor: Editor;
  onEditLink: () => void;
}

export function shouldShowSelectionMenu(
  editor: Editor,
  state: EditorState,
): boolean {
  return (
    !(state.selection instanceof NodeSelection) &&
    !state.selection.empty &&
    editor.isEditable &&
    !editor.isActive("codeBlock") &&
    !editor.isActive("frontmatter")
  );
}

interface MenuButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function MenuButton({
  label,
  active = false,
  onClick,
  children,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`notion-menu-button ${active ? "is-active" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const BLOCK_STYLES = [
  { value: "text", label: msg("Text"), shortLabel: msg("Text"), icon: PilcrowIcon },
  { value: "h1", label: msg("Heading 1"), shortLabel: msg("H1"), icon: Heading1Icon },
  { value: "h2", label: msg("Heading 2"), shortLabel: msg("H2"), icon: Heading2Icon },
  { value: "h3", label: msg("Heading 3"), shortLabel: msg("H3"), icon: Heading3Icon },
  { value: "h4", label: msg("Heading 4"), shortLabel: msg("H4"), icon: Heading4Icon },
  {
    value: "bulletList",
    label: msg("Bulleted list"),
    shortLabel: msg("Bullets"),
    icon: ListIcon,
  },
  {
    value: "orderedList",
    label: msg("Numbered list"),
    shortLabel: msg("Numbered"),
    icon: ListOrderedIcon,
  },
  {
    value: "taskList",
    label: msg("Task list"),
    shortLabel: msg("Tasks"),
    icon: CheckSquareIcon,
  },
  { value: "quote", label: msg("Quote"), shortLabel: msg("Quote"), icon: QuoteIcon },
] as const;

type BlockStyle = (typeof BLOCK_STYLES)[number]["value"];

const BLOCK_DRAG_HANDLE_POSITION_CONFIG = {
  placement: "left",
  strategy: "absolute",
} satisfies NonNullable<
  React.ComponentProps<typeof DragHandle>["computePositionConfig"]
>;

const BLOCK_DRAG_NESTED_OPTIONS: Exclude<
  React.ComponentProps<typeof DragHandle>["nested"],
  boolean | undefined
> = {
  edgeDetection: {
    edges: ["left", "top"],
    threshold: 12,
    strength: 200,
  },
};

const LIST_ITEM_NODE_TYPES = new Set(["listItem", "taskItem"]);

function getFirstTextRect(element: HTMLElement): DOMRect | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();

  while (textNode) {
    const value = textNode.textContent ?? "";
    const firstCharacter = value.search(/\S/);
    if (firstCharacter >= 0) {
      try {
        const range = document.createRange();
        range.setStart(textNode, firstCharacter);
        range.setEnd(textNode, firstCharacter + 1);
        const rect = range.getBoundingClientRect();
        if (
          Number.isFinite(rect.top) &&
          Number.isFinite(rect.bottom) &&
          rect.height > 0
        ) {
          return rect;
        }
      } catch {
        return null;
      }
    }
    textNode = walker.nextNode();
  }

  return null;
}

function getFirstLineVerticalBounds(
  element: HTMLElement,
  targetRect: DOMRect,
): { top: number; bottom: number } {
  const firstTextRect = getFirstTextRect(element);
  if (firstTextRect) {
    return {
      top: Math.max(targetRect.top, firstTextRect.top),
      bottom: Math.min(targetRect.bottom, firstTextRect.bottom),
    };
  }

  const lineElements = [
    element,
    element.querySelector<HTMLElement>("p, h1, h2, h3, h4, h5, h6"),
  ];

  for (const lineElement of lineElements) {
    if (!lineElement) continue;
    const lineHeights = [
      lineElement.style.lineHeight,
      window.getComputedStyle(lineElement).lineHeight,
    ];
    for (const value of lineHeights) {
      const lineHeight = Number.parseFloat(value);
      if (Number.isFinite(lineHeight) && lineHeight > 0) {
        return {
          top: targetRect.top,
          bottom: targetRect.top + Math.min(lineHeight, targetRect.height),
        };
      }
    }
  }

  for (const lineElement of lineElements) {
    if (!lineElement) continue;
    const fontSize = Number.parseFloat(
      window.getComputedStyle(lineElement).fontSize,
    );
    if (Number.isFinite(fontSize) && fontSize > 0) {
      return {
        top: targetRect.top,
        bottom:
          targetRect.top + Math.min(fontSize * 1.2, targetRect.height),
      };
    }
  }

  return { top: targetRect.top, bottom: targetRect.bottom };
}

function createReferenceRect(
  left: number,
  top: number,
  right: number,
  bottom: number,
): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    toJSON: () => ({}),
  };
}

function viewportRectToPositioningRootRect(
  rect: DOMRect,
  positioningRootRect: DOMRect,
): DOMRect {
  const zoom = getInterfaceZoom();
  if (zoom === 1) return rect;

  return createReferenceRect(
    positioningRootRect.left + (rect.left - positioningRootRect.left) / zoom,
    positioningRootRect.top + (rect.top - positioningRootRect.top) / zoom,
    positioningRootRect.left + (rect.right - positioningRootRect.left) / zoom,
    positioningRootRect.top + (rect.bottom - positioningRootRect.top) / zoom,
  );
}

export function getBlockDragHandleReferenceRect(
  editor: Editor,
  target: BlockDragTarget,
): DOMRect | null {
  const domNode = editor.view.nodeDOM(target.pos);
  const element =
    domNode instanceof HTMLElement ? domNode : domNode?.parentElement;
  if (!element) return null;

  const targetRect = element.getBoundingClientRect();
  if (target.node.type.name === "image") {
    return createReferenceRect(
      targetRect.left,
      targetRect.top,
      targetRect.right,
      targetRect.top + Math.min(28, targetRect.height),
    );
  }
  const usesFirstLine =
    target.node.isTextblock || LIST_ITEM_NODE_TYPES.has(target.node.type.name);
  const verticalBounds = usesFirstLine
    ? getFirstLineVerticalBounds(element, targetRect)
    : { top: targetRect.top, bottom: targetRect.bottom };
  if (!LIST_ITEM_NODE_TYPES.has(target.node.type.name)) {
    return createReferenceRect(
      targetRect.left,
      verticalBounds.top,
      targetRect.right,
      verticalBounds.bottom,
    );
  }

  const list = element.closest("ul, ol");
  if (!list) {
    return createReferenceRect(
      targetRect.left,
      verticalBounds.top,
      targetRect.right,
      verticalBounds.bottom,
    );
  }

  const listRect = list.getBoundingClientRect();
  return createReferenceRect(
    listRect.left,
    verticalBounds.top,
    listRect.right,
    verticalBounds.bottom,
  );
}

function getActiveBlockStyle(editor: Editor): BlockStyle {
  if (editor.isActive("taskList")) return "taskList";
  if (editor.isActive("bulletList")) return "bulletList";
  if (editor.isActive("orderedList")) return "orderedList";
  if (editor.isActive("blockquote")) return "quote";
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("heading", { level: 4 })) return "h4";
  return "text";
}

function applyBlockStyle(editor: Editor, style: BlockStyle): void {
  const activeStyle = getActiveBlockStyle(editor);
  const chain = editor.chain().focus();

  if (activeStyle === style) {
    chain.run();
    return;
  }

  if (activeStyle === "bulletList") chain.toggleBulletList();
  if (activeStyle === "orderedList") chain.toggleOrderedList();
  if (activeStyle === "taskList") chain.toggleTaskList();
  if (activeStyle === "quote") chain.toggleBlockquote();

  if (style === "text") chain.setParagraph();
  if (style === "h1") chain.setHeading({ level: 1 });
  if (style === "h2") chain.setHeading({ level: 2 });
  if (style === "h3") chain.setHeading({ level: 3 });
  if (style === "h4") chain.setHeading({ level: 4 });
  if (style === "bulletList") chain.setParagraph().toggleBulletList();
  if (style === "orderedList") chain.setParagraph().toggleOrderedList();
  if (style === "taskList") chain.setParagraph().toggleTaskList();
  if (style === "quote") chain.setParagraph().toggleBlockquote();

  chain.run();
}

function BlockStyleMenu({
  editor,
  activeStyle,
  portalContainer,
}: {
  editor: Editor;
  activeStyle: BlockStyle;
  portalContainer: HTMLElement | null;
}) {
  const t = useT();
  const activeOption =
    BLOCK_STYLES.find((option) => option.value === activeStyle) ??
    BLOCK_STYLES[0];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="notion-menu-button notion-block-style-trigger"
          aria-label={t("Block style: {shortLabel}", { shortLabel: t(activeOption.shortLabel) })}
          title={t("Block style")}
          onMouseDown={(event) => event.preventDefault()}
        >
          <ActiveIcon className="w-4 h-4 stroke-[1.6]" />
          <span>{t(activeOption.shortLabel)}</span>
          <ChevronDownIcon className="w-3 h-3 stroke-[1.8] notion-block-style-chevron" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={portalContainer ?? undefined}>
        <DropdownMenu.Content
          className="notion-block-style-menu"
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          {BLOCK_STYLES.map((option) => {
            const OptionIcon = option.icon;
            const isActive = option.value === activeStyle;

            return (
              <Fragment key={option.value}>
                {option.value === "bulletList" ? (
                  <DropdownMenu.Separator className="notion-block-style-separator" />
                ) : null}
                <DropdownMenu.Item
                  className={`notion-block-style-item ${isActive ? "is-active" : ""}`}
                  aria-label={t("Set block style to {label}", { label: t(option.label) })}
                  onSelect={() => applyBlockStyle(editor, option.value)}
                >
                  <OptionIcon className="w-4.5 h-4.5 stroke-[1.6]" />
                  <span>{t(option.label)}</span>
                  {isActive ? (
                    <CheckIcon className="w-3.5 h-3.5 stroke-2" />
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </DropdownMenu.Item>
              </Fragment>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ColorMenu({
  editor,
  kind,
  activeColor,
  portalContainer,
}: {
  editor: Editor;
  kind: "text" | "highlight";
  activeColor: string | null;
  portalContainer: HTMLElement | null;
}) {
  const t = useT();
  const colors =
    kind === "text" ? TEXT_COLOR_OPTIONS : HIGHLIGHT_COLOR_OPTIONS;
  const activeOption = colors.find(({ value }) => value === activeColor);
  const getThemeStyle = (color: (typeof colors)[number]) =>
    ({
      "--notion-color-light": color.light,
      "--notion-color-dark": color.dark,
    }) as React.CSSProperties;

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="notion-menu-button notion-color-trigger"
          aria-label={kind === "text" ? t("Text color") : t("Highlight color")}
          title={kind === "text" ? t("Text color") : t("Highlight color")}
          onMouseDown={(event) => event.preventDefault()}
        >
          <span>{kind === "text" ? "A" : "H"}</span>
          <span
            className="notion-color-indicator"
            data-theme-color={activeOption ? "true" : undefined}
            style={
              activeOption
                ? getThemeStyle(activeOption)
                : {
                    backgroundColor:
                      kind === "text" ? "currentColor" : "#fde047",
                  }
            }
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={portalContainer ?? undefined}>
        <DropdownMenu.Content
          className="notion-color-menu"
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenu.Item
            className="notion-color-clear"
            onSelect={() => {
              if (kind === "text") {
                editor.chain().focus().unsetColor().run();
              } else {
                editor.chain().focus().unsetHighlight().run();
              }
            }}
          >
            {t("Default")}
          </DropdownMenu.Item>
          <div className="notion-color-grid">
            {colors.map((color) => (
              <DropdownMenu.Item
                key={color.value}
                aria-label={`${kind} ${color.value}`}
                title={color.value}
                className={`notion-color-swatch ${activeColor === color.value ? "is-active" : ""}`}
                style={getThemeStyle(color)}
                onSelect={() => {
                  if (kind === "text") {
                    editor.chain().focus().setColor(color.value).run();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .setHighlight({ color: color.value })
                      .run();
                  }
                }}
              />
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function SelectionMenu({ editor, onEditLink }: SelectionMenuProps) {
  const t = useT();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    setMenuElement(menuRef.current);
  }, []);
  const active = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor.isActive("bold"),
      italic: currentEditor.isActive("italic"),
      underline: currentEditor.isActive("underline"),
      strike: currentEditor.isActive("strike"),
      code: currentEditor.isActive("code"),
      subscript: currentEditor.isActive("subscript"),
      superscript: currentEditor.isActive("superscript"),
      link: currentEditor.isActive("link"),
      blockStyle: getActiveBlockStyle(currentEditor),
      textColor:
        (currentEditor.getAttributes("textStyle").color as string | undefined) ??
        null,
      highlightColor:
        (currentEditor.getAttributes("highlight").color as string | undefined) ??
        null,
    }),
  });

  return (
    <BubbleMenu
      ref={menuRef}
      editor={editor}
      pluginKey="scratch-selection-menu"
      updateDelay={80}
      options={{ placement: "bottom", offset: 8, flip: true }}
      shouldShow={({ state }) => shouldShowSelectionMenu(editor, state)}
      className="notion-selection-menu"
    >
      <div className="notion-selection-toolbar">
      <BlockStyleMenu
        editor={editor}
        activeStyle={active.blockStyle}
        portalContainer={menuElement}
      />
      <span className="notion-menu-separator" />
      <MenuButton
        label={t("Bold")}
        active={active.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="w-4.5 h-4.5 stroke-[1.5]" />
      </MenuButton>
      <MenuButton
        label={t("Italic")}
        active={active.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="w-4.5 h-4.5 stroke-[1.5]" />
      </MenuButton>
      <MenuButton
        label={t("Underline")}
        active={active.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <u>U</u>
      </MenuButton>
      <MenuButton
        label={t("Strikethrough")}
        active={active.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="w-4.5 h-4.5 stroke-[1.5]" />
      </MenuButton>
      <MenuButton
        label={t("Inline code")}
        active={active.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <InlineCodeIcon className="w-4.5 h-4.5 stroke-[1.5]" />
      </MenuButton>
      <MenuButton
        label={t("Clear formatting")}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        Tx
      </MenuButton>
      <span className="notion-menu-separator" />
      <ColorMenu
        editor={editor}
        kind="text"
        activeColor={active.textColor}
        portalContainer={menuElement}
      />
      <ColorMenu
        editor={editor}
        kind="highlight"
        activeColor={active.highlightColor}
        portalContainer={menuElement}
      />
      <span className="notion-menu-separator" />
      <MenuButton
        label={t("Subscript")}
        active={active.subscript}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        X<sub>2</sub>
      </MenuButton>
      <MenuButton
        label={t("Superscript")}
        active={active.superscript}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        X<sup>2</sup>
      </MenuButton>
      <MenuButton
        label={active.link ? t("Edit link") : t("Add link")}
        active={active.link}
        onClick={onEditLink}
      >
        <LinkIcon className="w-4.5 h-4.5 stroke-[1.5]" />
      </MenuButton>
      </div>
    </BubbleMenu>
  );
}

export function BlockDragControls({ editor }: { editor: Editor }) {
  const t = useT();
  const [nodePos, setNodePos] = useState<number | null>(null);
  const [tableBlockHandleProximate, setTableBlockHandleProximate] =
    useState(false);
  const [pointerDropIndicator, setPointerDropIndicator] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [sourceOutline, setSourceOutline] = useState<DOMRect | null>(null);
  const targetRef = useRef<BlockDragTarget | null>(null);
  const dragSessionRef = useRef<{
    target: BlockDragTarget;
    initialDoc: Editor["state"]["doc"];
    lastPoint: { left: number; top: number } | null;
    cancelled: boolean;
  } | null>(null);
  const pointerDragSessionRef = useRef<{
    pointerId: number;
    target: BlockDragTarget;
    initialDoc: Editor["state"]["doc"];
    startPoint: { left: number; top: number };
    lastPoint: { left: number; top: number };
    origin: HTMLElement;
    active: boolean;
    ghost: HTMLElement | null;
  } | null>(null);
  const getTargetRect = useCallback(
    (target: BlockDragTarget | null) => {
      const dom = target ? editor.view.nodeDOM(target.pos) : null;
      return dom instanceof Element ? dom.getBoundingClientRect() : null;
    },
    [editor],
  );
  const usePointerBlockDrag =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  const handleNodeChange = useCallback(
    ({ node, pos }: Parameters<NonNullable<React.ComponentProps<typeof DragHandle>["onNodeChange"]>>[0]) => {
      const target = node ? { node, pos } : null;
      const movableTarget =
        target && isCurrentMovableBlockDragTarget(editor, target)
          ? target
          : null;
      targetRef.current = movableTarget;
      setNodePos(movableTarget?.pos ?? null);
      setTableBlockHandleProximate(
        Boolean(movableTarget && movableTarget.node.type.name !== "table"),
      );
    },
    [editor],
  );
  const getReferencedVirtualElement = useCallback(() => {
    const target = targetRef.current;
    if (!target) return null;

    return {
      getBoundingClientRect: () => {
        const blockRect =
          getBlockDragHandleReferenceRect(editor, target) ??
          editor.view.dom.getBoundingClientRect();
        const rect =
          target.node.type.name === "table"
            ? (() => {
                const tableReference =
                  getTableBlockHandleReferenceRect(blockRect);
                return createReferenceRect(
                  tableReference.left,
                  tableReference.top,
                  tableReference.right,
                  tableReference.bottom,
                );
              })()
            : blockRect;
        const positioningRoot =
          editor.view.dom.closest<HTMLElement>(".notion-editor-shell") ??
          document.documentElement;
        return viewportRectToPositioningRootRect(
          rect,
          positioningRoot.getBoundingClientRect(),
        );
      },
    };
  }, [editor]);

  useEffect(() => {
    const updateTableBlockHandleProximity = (event: PointerEvent) => {
      const target = targetRef.current;
      if (!target || target.node.type.name !== "table") return;
      const nodeDom = editor.view.nodeDOM(target.pos);
      const element =
        nodeDom instanceof HTMLElement ? nodeDom : nodeDom?.parentElement;
      const nextVisible = Boolean(
        element &&
          isTableBlockHandleProximity(element.getBoundingClientRect(), {
            left: event.clientX,
            top: event.clientY,
          }),
      );
      setTableBlockHandleProximate((current) =>
        current === nextVisible ? current : nextVisible,
      );
    };

    document.addEventListener("pointermove", updateTableBlockHandleProximity, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener(
        "pointermove",
        updateTableBlockHandleProximity,
        true,
      );
    };
  }, [editor]);

  useEffect(() => {
    let animationFrame: number | null = null;

    const invalidateHandlePosition = () => {
      if (animationFrame !== null) return;

      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        if (editor.isDestroyed) return;

        editor.view.dispatch(
          editor.state.tr
            .setMeta("hideDragHandle", true)
            .setMeta("addToHistory", false),
        );
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(invalidateHandlePosition);
    const observedElements = [
      editor.view.dom,
      editor.view.dom.parentElement,
      editor.view.dom.closest("[data-editor-scroll]"),
    ];

    for (const element of new Set(observedElements)) {
      if (element) resizeObserver?.observe(element);
    }
    window.addEventListener("resize", invalidateHandlePosition);

    return () => {
      window.removeEventListener("resize", invalidateHandlePosition);
      resizeObserver?.disconnect();
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [editor]);

  const resetPointerDrag = useCallback(() => {
    const session = pointerDragSessionRef.current;
    pointerDragSessionRef.current = null;
    setPointerDropIndicator(null);
    setSourceOutline(null);
    session?.ghost?.remove();
    document.body.classList.remove("notion-block-dragging");
    editor.view.dom.removeAttribute("data-block-pointer-dragging");

    if (session?.origin.hasPointerCapture?.(session.pointerId)) {
      session.origin.releasePointerCapture(session.pointerId);
    }
  }, [editor]);

  const beginPointerDrag = useCallback(
    (
      event: PointerEvent,
      target: BlockDragTarget,
      origin: HTMLElement,
      preventSelection: boolean,
    ) => {
      if (
        !usePointerBlockDrag ||
        event.button !== 0 ||
        !event.isPrimary ||
        !isCurrentMovableBlockDragTarget(editor, target)
      ) {
        return;
      }

      if (preventSelection) {
        event.preventDefault();
        event.stopPropagation();
      }

      const point = { left: event.clientX, top: event.clientY };
      pointerDragSessionRef.current = {
        pointerId: event.pointerId,
        target,
        initialDoc: editor.state.doc,
        startPoint: point,
        lastPoint: point,
        origin,
        active: false,
        ghost: null,
      };
      document.body.classList.add("notion-block-dragging");
      try {
        origin.setPointerCapture(event.pointerId);
      } catch {
        // Document-level listeners still complete the gesture if capture fails.
      }
    },
    [editor, usePointerBlockDrag],
  );

  useEffect(() => {
    if (!usePointerBlockDrag) return;

    const editorDom = editor.view.dom;
    editorDom.classList.add("notion-pointer-block-drag-enabled");

    const beginImagePointerDrag = (event: PointerEvent) => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) return;
      const image = eventTarget.closest("img");
      if (!(image instanceof HTMLElement) || !editorDom.contains(image)) return;

      const target = getTopLevelBlockDragTargetFromDom(editor, image);
      if (!target || target.node.type.name !== "image") return;
      beginPointerDrag(event, target, image, false);
    };
    const preventNativeImageDrag = (event: DragEvent) => {
      const eventTarget = event.target;
      if (
        eventTarget instanceof Element &&
        eventTarget.closest("img") &&
        editorDom.contains(eventTarget)
      ) {
        event.preventDefault();
      }
    };
    const updatePointerDrag = (event: PointerEvent) => {
      const session = pointerDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      session.lastPoint = { left: event.clientX, top: event.clientY };
      if (
        !session.active &&
        hasExceededBlockPointerDragThreshold(
          session.startPoint,
          session.lastPoint,
        )
      ) {
        session.active = true;
        editorDom.setAttribute("data-block-pointer-dragging", "true");
        const source = editor.view.nodeDOM(session.target.pos);
        if (source instanceof HTMLElement) {
          const ghost = document.createElement("div");
          ghost.className = `${editorDom.className} notion-block-drag-ghost`;
          ghost.setAttribute("aria-hidden", "true");
          ghost.appendChild(source.cloneNode(true));
          document.body.appendChild(ghost);
          session.ghost = ghost;
        }
      }
      if (!session.active) return;

      event.preventDefault();
      const sourceRect = getTargetRect(session.target);
      setSourceOutline(sourceRect);
      if (session.ghost && sourceRect) {
        const zoom = getInterfaceZoom();
        session.ghost.style.left = `${(sourceRect.left + session.lastPoint.left - session.startPoint.left) / zoom}px`;
        session.ghost.style.top = `${(sourceRect.top + session.lastPoint.top - session.startPoint.top) / zoom}px`;
        session.ghost.style.width = `${sourceRect.width / zoom}px`;
      }
      const dropTarget = resolveBlockDropTarget(
        editor,
        session.target,
        session.lastPoint,
      );
      setPointerDropIndicator(
        dropTarget
          ? {
              top: dropTarget.indicatorTop,
              left: dropTarget.indicatorLeft,
              width: dropTarget.indicatorWidth,
            }
          : null,
      );
    };
    const finishPointerDrag = (event: PointerEvent) => {
      const session = pointerDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      if (session.active) {
        event.preventDefault();
        event.stopPropagation();
        if (editor.state.doc.eq(session.initialDoc)) {
          moveBlockAtPoint(editor, session.target, session.lastPoint);
        }
      }
      resetPointerDrag();
    };
    const cancelPointerDrag = (event: PointerEvent) => {
      const session = pointerDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;
      resetPointerDrag();
    };
    const cancelPointerDragWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && pointerDragSessionRef.current) {
        resetPointerDrag();
      }
    };

    editorDom.addEventListener("pointerdown", beginImagePointerDrag);
    editorDom.addEventListener("dragstart", preventNativeImageDrag, true);
    document.addEventListener("pointermove", updatePointerDrag, {
      capture: true,
      passive: false,
    });
    document.addEventListener("pointerup", finishPointerDrag, true);
    document.addEventListener("pointercancel", cancelPointerDrag, true);
    document.addEventListener("keydown", cancelPointerDragWithKeyboard, true);
    return () => {
      editorDom.classList.remove("notion-pointer-block-drag-enabled");
      editorDom.removeEventListener("pointerdown", beginImagePointerDrag);
      editorDom.removeEventListener("dragstart", preventNativeImageDrag, true);
      document.removeEventListener("pointermove", updatePointerDrag, true);
      document.removeEventListener("pointerup", finishPointerDrag, true);
      document.removeEventListener("pointercancel", cancelPointerDrag, true);
      document.removeEventListener(
        "keydown",
        cancelPointerDragWithKeyboard,
        true,
      );
      resetPointerDrag();
    };
  }, [
    beginPointerDrag,
    editor,
    getTargetRect,
    resetPointerDrag,
    usePointerBlockDrag,
  ]);

  useEffect(() => {
    const rememberDragPoint = (event: DragEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;
      session.lastPoint = { left: event.clientX, top: event.clientY };
    };
    const cancelFallback = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dragSessionRef.current) {
        dragSessionRef.current.cancelled = true;
      }
    };

    document.addEventListener("dragover", rememberDragPoint, true);
    document.addEventListener("keydown", cancelFallback, true);
    return () => {
      document.removeEventListener("dragover", rememberDragPoint, true);
      document.removeEventListener("keydown", cancelFallback, true);
    };
  }, []);

  const handleDragStart = useCallback(() => {
    const target = targetRef.current;
    if (!target || !isCurrentMovableBlockDragTarget(editor, target)) {
      dragSessionRef.current = null;
      return;
    }

    dragSessionRef.current = {
      target,
      initialDoc: editor.state.doc,
      lastPoint: null,
      cancelled: false,
    };
  }, [editor]);

  const handleDragEnd = useCallback(() => {
    const session = dragSessionRef.current;
    dragSessionRef.current = null;
    if (
      session?.lastPoint &&
      !session.cancelled &&
      editor.state.doc.eq(session.initialDoc)
    ) {
      moveBlockAtPoint(editor, session.target, session.lastPoint);
    }
  }, [editor]);

  const addBlock = () => {
    const target = targetRef.current;
    if (
      nodePos === null ||
      !target ||
      !isCurrentMovableBlockDragTarget(editor, target)
    ) {
      return;
    }

    const isListItem = LIST_ITEM_NODE_TYPES.has(target.node.type.name);
    const content = isListItem
      ? {
          type: target.node.type.name,
          attrs: target.node.type.name === "taskItem" ? { checked: false } : {},
          content: [{ type: "paragraph" }],
        }
      : { type: "paragraph" };
    const selectionPosition = target.pos + (isListItem ? 2 : 1);
    const inserted = editor
      .chain()
      .focus()
      .insertContentAt(target.pos, content)
      .setTextSelection(selectionPosition)
      .run();

    if (!inserted) editor.chain().focus().createParagraphNear().run();
  };

  const isTableTarget = targetRef.current?.node.type.name === "table";
  const isHandleProximate =
    nodePos !== null && (!isTableTarget || tableBlockHandleProximate);

  return (
    <>
      <DragHandle
        editor={editor}
        pluginKey="scratch-block-drag-handle"
        nested={BLOCK_DRAG_NESTED_OPTIONS}
        computePositionConfig={BLOCK_DRAG_HANDLE_POSITION_CONFIG}
        getReferencedVirtualElement={getReferencedVirtualElement}
        className={`notion-block-drag-handle ${isHandleProximate ? "is-block-hovered" : ""} ${isTableTarget ? "is-table-block" : ""} ${usePointerBlockDrag ? "uses-pointer-drag" : ""}`}
        onNodeChange={handleNodeChange}
        onElementDragStart={handleDragStart}
        onElementDragEnd={handleDragEnd}
        aria-hidden={!isHandleProximate}
      >
        <button
          type="button"
          className="notion-block-add"
          aria-label={t("Add block")}
          title={t("Add block")}
          tabIndex={isHandleProximate ? 0 : -1}
          draggable={false}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={addBlock}
        >
          <PlusIcon className="notion-block-control-icon" />
        </button>
        <button
          type="button"
          className="notion-block-grip"
          aria-label={t("Move block with Arrow Up or Arrow Down")}
          aria-keyshortcuts="ArrowUp ArrowDown"
          title={t("Drag block; use Arrow Up or Arrow Down from the keyboard")}
          tabIndex={isHandleProximate ? 0 : -1}
          draggable={false}
          onPointerEnter={() => setSourceOutline(getTargetRect(targetRef.current))}
          onPointerLeave={() => {
            if (!pointerDragSessionRef.current) setSourceOutline(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            const target = targetRef.current;
            if (!target) return;
            event.preventDefault();
            event.stopPropagation();
            const grip = event.currentTarget;
            const movedTarget = moveBlockByKeyboard(
              editor,
              target,
              event.key === "ArrowUp" ? -1 : 1,
            );
            if (!movedTarget) return;
            targetRef.current = movedTarget;
            setNodePos(movedTarget.pos);
            requestAnimationFrame(() => {
              grip.focus();
            });
          }}
          onPointerDown={(event) => {
            const target = targetRef.current;
            if (target) {
              beginPointerDrag(
                event.nativeEvent,
                target,
                event.currentTarget,
                true,
              );
            }
          }}
        >
          <GripVerticalIcon className="notion-block-control-icon" />
        </button>
      </DragHandle>
      {sourceOutline &&
        createPortal(
          <div
            className="notion-block-source-outline"
            aria-hidden="true"
            style={{
              top: sourceOutline.top / getInterfaceZoom(),
              left: sourceOutline.left / getInterfaceZoom(),
              width: sourceOutline.width / getInterfaceZoom(),
              height: sourceOutline.height / getInterfaceZoom(),
            }}
          />,
          document.body,
        )}
      {pointerDropIndicator &&
        createPortal(
          <div
            className="notion-block-drop-indicator"
            aria-hidden="true"
            style={{
              top: pointerDropIndicator.top / getInterfaceZoom(),
              left: pointerDropIndicator.left / getInterfaceZoom(),
              width: pointerDropIndicator.width / getInterfaceZoom(),
            }}
          />,
          document.body,
        )}
    </>
  );
}
