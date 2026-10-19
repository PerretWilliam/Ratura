import { useTheme, defaultThemeColors } from "../../context/ThemeContext";
import { Button, CodeCopyButton, IconButton, Input, Select, Textarea } from "../ui";
import { ColorPicker } from "../ui/ColorPicker";
import type {
  FontFamily,
  TextDirection,
  EditorWidth,
  ThemeColorKey,
  PasteMode,
} from "../../types/note";
import { ChevronRightIcon, EyeIcon, MinusIcon, PlusIcon } from "../icons";
import { cn } from "../../lib/utils";
import { msg, useT, type Message } from "../../i18n";

// Human-readable labels for theme color keys, grouped logically
const colorLabels: { key: ThemeColorKey; label: Message; group: Message }[] = [
  // Surfaces
  { key: "bg", label: msg("Background"), group: msg("Surfaces") },
  { key: "bg-secondary", label: msg("Sidebar"), group: msg("Surfaces") },
  { key: "bg-muted", label: msg("Hover & Subtle Fill"), group: msg("Surfaces") },
  { key: "bg-emphasis", label: msg("Strong Fill"), group: msg("Surfaces") },
  // Text & UI
  { key: "text", label: msg("Text"), group: msg("Text & UI") },
  { key: "text-muted", label: msg("Secondary Text"), group: msg("Text & UI") },
  { key: "accent", label: msg("Primary & Buttons"), group: msg("Text & UI") },
  { key: "border", label: msg("Borders"), group: msg("Text & UI") },
  { key: "selection", label: msg("Selection Highlight"), group: msg("Text & UI") },
];

// Text direction options
const textDirectionOptions: { value: TextDirection; label: Message }[] = [
  { value: "auto", label: msg("Auto") },
  { value: "ltr", label: msg("LTR") },
  { value: "rtl", label: msg("RTL") },
];

// Page width options
const editorWidthOptions: { value: EditorWidth; label: Message }[] = [
  { value: "narrow", label: msg("Narrow") },
  { value: "normal", label: msg("Normal") },
  { value: "wide", label: msg("Wide") },
  { value: "full", label: msg("Full") },
  { value: "custom", label: msg("Custom") },
];

// Font family options
const fontFamilyOptions: { value: FontFamily; label: Message }[] = [
  { value: "system-sans", label: msg("Sans") },
  { value: "serif", label: msg("Serif") },
  { value: "monospace", label: msg("Mono") },
];

// Paste mode options
const pasteModeOptions: { value: PasteMode; label: Message; description: Message }[] = [
  { value: "markdown", label: msg("Markdown"), description: msg("Parse and render markdown syntax") },
  { value: "plain", label: msg("Plain text"), description: msg("Insert as plain text, no formatting") },
  { value: "code-block", label: msg("Code block"), description: msg("Wrap in a ``` code block") },
];

const themeModeLabels = {
  light: msg("Light"),
  dark: msg("Dark"),
  system: msg("System"),
};

// Bold weight options (medium excluded for monospace)
const boldWeightOptions = [
  { value: 500, label: msg("Medium"), excludeForMonospace: true },
  { value: 600, label: msg("Semibold"), excludeForMonospace: false },
  { value: 700, label: msg("Bold"), excludeForMonospace: false },
  { value: 800, label: msg("Extra Bold"), excludeForMonospace: false },
];

interface EditorWidthResizeControlProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

interface BinarySettingControlProps {
  label: string;
  description: string;
  ariaLabel: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function BinarySettingControl({
  label,
  description,
  ariaLabel,
  value,
  onChange,
}: BinarySettingControlProps) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm text-text font-medium">{label}</div>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <div
        role="group"
        aria-label={ariaLabel}
        className="flex gap-1 p-1 rounded-[10px] border border-border shrink-0"
      >
        <Button
          type="button"
          variant={!value ? "primary" : "ghost"}
          size="xs"
          aria-pressed={!value}
          onClick={() => onChange(false)}
        >
          {t("Off")}
        </Button>
        <Button
          type="button"
          variant={value ? "primary" : "ghost"}
          size="xs"
          aria-pressed={value}
          onClick={() => onChange(true)}
        >
          {t("On")}
        </Button>
      </div>
    </div>
  );
}

export function EditorWidthResizeControl({
  enabled,
  onChange,
}: EditorWidthResizeControlProps) {
  const t = useT();
  return (
    <BinarySettingControl
      label={t("Resize with Mouse")}
      description={t("Drag the page edges to change its width")}
      ariaLabel={t("Resize editor with mouse")}
      value={enabled}
      onChange={onChange}
    />
  );
}

interface EditorToolbarVisibilityControlProps {
  visible: boolean;
  onChange: (visible: boolean) => void;
}

export function EditorToolbarVisibilityControl({
  visible,
  onChange,
}: EditorToolbarVisibilityControlProps) {
  const t = useT();
  return (
    <BinarySettingControl
      label={t("Formatting Toolbar")}
      description={t("Show the fixed toolbar above the document")}
      ariaLabel={t("Show formatting toolbar")}
      value={visible}
      onChange={onChange}
    />
  );
}

interface TitleBarNoteInfoControlsProps {
  modifiedDateVisible: boolean;
  filenameVisible: boolean;
  onModifiedDateChange: (visible: boolean) => void;
  onFilenameChange: (visible: boolean) => void;
}

type TitleBarNoteInfoMode = "modifiedDate" | "filename" | "none";

export function TitleBarNoteInfoControls({
  modifiedDateVisible,
  filenameVisible,
  onModifiedDateChange,
  onFilenameChange,
}: TitleBarNoteInfoControlsProps) {
  const t = useT();
  let mode: TitleBarNoteInfoMode = "none";
  if (filenameVisible) {
    mode = "filename";
  } else if (modifiedDateVisible) {
    mode = "modifiedDate";
  }

  const handleModeChange = (nextMode: TitleBarNoteInfoMode) => {
    if (nextMode === "filename") {
      onFilenameChange(true);
      return;
    }

    if (nextMode === "modifiedDate") {
      onModifiedDateChange(true);
      return;
    }

    if (filenameVisible) {
      onFilenameChange(false);
    } else if (modifiedDateVisible) {
      onModifiedDateChange(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm text-text font-medium">
          {t("Title Bar Information")}
        </div>
        <p className="text-xs text-text-muted">
          {t("Choose what appears beside the note icon")}
        </p>
      </div>
      <Select
        aria-label={t("Title bar information")}
        value={mode}
        onChange={(event) =>
          handleModeChange(event.target.value as TitleBarNoteInfoMode)
        }
        className="w-44"
      >
        <option value="modifiedDate">{t("Modification Date")}</option>
        <option value="filename">{t("Filename")}</option>
        <option value="none">{t("None")}</option>
      </Select>
    </div>
  );
}

export function AppearanceSettingsSection() {
  const {
    theme,
    resolvedTheme,
    setTheme,
    editorFontSettings,
    setEditorFontSetting,
    resetEditorFontSettings,
    textDirection,
    setTextDirection,
    spellCheckEnabled,
    setSpellCheckEnabled,
    autoCorrectEnabled,
    setAutoCorrectEnabled,
    editorWidth,
    setEditorWidth,
    interfaceZoom,
    setInterfaceZoom,
    customEditorWidthPx,
    setCustomEditorWidthPx,
    editorWidthResizeEnabled,
    setEditorWidthResizeEnabled,
    editorToolbarVisible,
    setEditorToolbarVisible,
    titleBarModifiedDateVisible,
    setTitleBarModifiedDateVisible,
    titleBarFilenameVisible,
    setTitleBarFilenameVisible,
    customColorsLight,
    customColorsDark,
    setCustomColor,
    resetCustomColor,
    resetAllCustomColors,
    pasteMode,
    setPasteMode,
    customCss,
    setCustomCss,
  } = useTheme();
  const t = useT();

  // Validated numeric change handler
  const handleNumericChange = (
    field: "baseFontSize" | "lineHeight",
    value: string,
    min: number,
    max: number,
  ) => {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(Math.max(parsed, min), max);
    setEditorFontSetting(field, clamped);
  };

  // Check if appearance settings differ from defaults
  const hasCustomAppearanceSettings =
    editorFontSettings.baseFontFamily !== "system-sans" ||
    editorFontSettings.baseFontSize !== 15 ||
    editorFontSettings.boldWeight !== 600 ||
    editorFontSettings.lineHeight !== 1.6 ||
    textDirection !== "auto" ||
    editorWidth !== "normal" ||
    !editorWidthResizeEnabled ||
    editorToolbarVisible ||
    !titleBarModifiedDateVisible ||
    titleBarFilenameVisible ||
    Math.round(interfaceZoom * 100) !== 100;

  // Filter weight options based on font family
  const isMonospace = editorFontSettings.baseFontFamily === "monospace";
  const availableWeightOptions = boldWeightOptions.filter(
    (opt) => !isMonospace || !opt.excludeForMonospace,
  );

  // Handle font family change - bump up weight if needed
  const handleFontFamilyChange = (newFamily: FontFamily) => {
    setEditorFontSetting("baseFontFamily", newFamily);
    // If switching to monospace and current weight is medium, bump to semibold
    if (newFamily === "monospace" && editorFontSettings.boldWeight === 500) {
      setEditorFontSetting("boldWeight", 600);
    }
  };

  return (
    <div className="space-y-8 py-8">
      {/* Theme Section */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-3">{t("Theme")}</h2>
        <div className="flex gap-2 p-1 rounded-[10px] border border-border">
          {(["light", "dark", "system"] as const).map((mode) => (
            <Button
              key={mode}
              onClick={() => setTheme(mode)}
              variant={theme === mode ? "primary" : "ghost"}
              size="md"
              className="flex-1"
            >
              {t(themeModeLabels[mode])}
            </Button>
          ))}
        </div>
        {theme === "system" && (
          <p className="mt-3 text-sm text-text-muted">
            {resolvedTheme === "dark"
              ? t("Currently using dark mode based on system preference")
              : t("Currently using light mode based on system preference")}
          </p>
        )}

        {/* Customize Colors */}
        {theme === "system" ? (
          <div className="mt-4 space-y-2">
            <ColorsExpandable
              label={t("Customize light colors")}
              mode="light"
              customColors={customColorsLight}
              setCustomColor={setCustomColor}
              resetCustomColor={resetCustomColor}
              resetAllCustomColors={resetAllCustomColors}
            />
            <ColorsExpandable
              label={t("Customize dark colors")}
              mode="dark"
              customColors={customColorsDark}
              setCustomColor={setCustomColor}
              resetCustomColor={resetCustomColor}
              resetAllCustomColors={resetAllCustomColors}
            />
          </div>
        ) : (
          <ColorsExpandable
            label={t("Customize colors")}
            mode={resolvedTheme}
            customColors={
              resolvedTheme === "dark" ? customColorsDark : customColorsLight
            }
            setCustomColor={setCustomColor}
            resetCustomColor={resetCustomColor}
            resetAllCustomColors={resetAllCustomColors}
            className="mt-4"
          />
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Writing Section */}
      <section>
        <h2 className="text-xl font-medium mb-3">{t("Writing")}</h2>
        <div className="rounded-[10px] border border-border pl-4 py-3 pr-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">
              {t("Spell Check")}
            </label>
            <div className="flex gap-1 p-1 rounded-[10px] border border-border shrink-0">
              <Button
                onClick={() => setSpellCheckEnabled(false)}
                variant={!spellCheckEnabled ? "primary" : "ghost"}
                size="xs"
              >
                {t("Off")}
              </Button>
              <Button
                onClick={() => setSpellCheckEnabled(true)}
                variant={spellCheckEnabled ? "primary" : "ghost"}
                size="xs"
              >
                {t("On")}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">
              {t("Auto Correct")}
            </label>
            <div className="flex gap-1 p-1 rounded-[10px] border border-border shrink-0">
              <Button
                onClick={() => setAutoCorrectEnabled(false)}
                variant={!autoCorrectEnabled ? "primary" : "ghost"}
                size="xs"
              >
                {t("Off")}
              </Button>
              <Button
                onClick={() => setAutoCorrectEnabled(true)}
                variant={autoCorrectEnabled ? "primary" : "ghost"}
                size="xs"
              >
                {t("On")}
              </Button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-text-muted">
          {t(
            "Auto Correct requires Spell Check. Enabling it also enables Spell Check. Spell checking may reduce performance when inserting large amounts of text.",
          )}
        </p>
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Typography Section */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl font-medium">{t("Typography")}</h2>
          {hasCustomAppearanceSettings && (
            <Button onClick={resetEditorFontSettings} variant="ghost" size="sm">
              {t("Reset to defaults")}
            </Button>
          )}
        </div>

        <div className="rounded-[10px] border border-border pl-4 py-3 pr-3 space-y-2">
          {/* Font Family */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("Font")}</label>
            <Select
              value={editorFontSettings.baseFontFamily}
              onChange={(e) =>
                handleFontFamilyChange(e.target.value as FontFamily)
              }
              className="w-40"
            >
              {fontFamilyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </Select>
          </div>

          {/* Base Font Size */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("Size")}</label>
            <div className="relative w-40">
              <Input
                type="number"
                min="12"
                max="24"
                value={editorFontSettings.baseFontSize}
                onChange={(e) =>
                  handleNumericChange("baseFontSize", e.target.value, 12, 24)
                }
                className="w-full h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Bold Weight */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("Bold Weight")}</label>
            <Select
              value={editorFontSettings.boldWeight}
              onChange={(e) =>
                setEditorFontSetting("boldWeight", Number(e.target.value))
              }
              className="w-40"
            >
              {availableWeightOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </Select>
          </div>

          {/* Line Height */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("Line Height")}</label>
            <div className="relative w-40">
              <Input
                type="number"
                min="1.0"
                max="2.5"
                step="0.1"
                value={editorFontSettings.lineHeight}
                onChange={(e) =>
                  handleNumericChange("lineHeight", e.target.value, 1.0, 2.5)
                }
                className="w-full h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Text Direction */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">
              {t("Text Direction")}
            </label>
            <Select
              value={textDirection}
              onChange={(e) =>
                setTextDirection(e.target.value as TextDirection)
              }
              className="w-40"
            >
              {textDirectionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </Select>
          </div>

          {/* Page Width */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("Page Width")}</label>
            <Select
              value={editorWidth}
              onChange={(e) => setEditorWidth(e.target.value as EditorWidth)}
              className="w-40"
            >
              {editorWidthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </Select>
          </div>
          {editorWidth === "custom" && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-text font-medium">
                {t("Custom Width")}
              </label>
              <div className="relative w-40 flex items-center gap-2">
                <Input
                  type="number"
                  min="480"
                  max="3840"
                  step="10"
                  value={customEditorWidthPx}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (Number.isFinite(parsed)) {
                      setCustomEditorWidthPx(
                        Math.min(Math.max(parsed, 480), 3840),
                      );
                    }
                  }}
                  className="w-full h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-text-muted">px</span>
              </div>
            </div>
          )}

          <EditorWidthResizeControl
            enabled={editorWidthResizeEnabled}
            onChange={setEditorWidthResizeEnabled}
          />

          <EditorToolbarVisibilityControl
            visible={editorToolbarVisible}
            onChange={setEditorToolbarVisible}
          />

          <TitleBarNoteInfoControls
            modifiedDateVisible={titleBarModifiedDateVisible}
            filenameVisible={titleBarFilenameVisible}
            onModifiedDateChange={setTitleBarModifiedDateVisible}
            onFilenameChange={setTitleBarFilenameVisible}
          />

          {/* Interface Zoom */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">
              {t("Interface Zoom")}
            </label>
            <div className="flex items-center gap-1 w-40">
              <IconButton
                variant="outline"
                size="md"
                onClick={() => setInterfaceZoom((prev) => prev - 0.05)}
                disabled={interfaceZoom <= 0.7}
                title={t("Zoom out")}
              >
                <MinusIcon className="w-4 h-4" />
              </IconButton>
              <span className="text-sm font-medium tabular-nums flex-1 text-center">
                {Math.round(interfaceZoom * 100)}%
              </span>
              <IconButton
                variant="outline"
                size="md"
                onClick={() => setInterfaceZoom((prev) => prev + 0.05)}
                disabled={interfaceZoom >= 1.5}
                title={t("Zoom in")}
              >
                <PlusIcon className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-3 relative">
          <div className="absolute top-3 left-4 flex items-center text-sm font-medium text-text-muted/70 gap-1">
            <EyeIcon className="w-4.5 h-4.5 stroke-[1.5]" />
            <span>{t("Preview")}</span>
          </div>
          <div className="border border-border rounded-[10px] bg-bg p-6 pt-20 max-h-160 overflow-hidden rounded-t-lg">
            <div
              className="prose prose-lg dark:prose-invert max-w-xl mx-auto"
              dir={textDirection}
              style={{
                fontFamily:
                  editorFontSettings.baseFontFamily === "system-sans"
                    ? "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    : editorFontSettings.baseFontFamily === "serif"
                      ? "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
                      : "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
                fontSize: `${editorFontSettings.baseFontSize}px`,
              }}
            >
              <h1>Kibble Maximization Protocol</h1>
              <p>
                A comprehensive strategy document for getting your humans to
                increase daily food portions.{" "}
                <strong>Time-tested methods</strong> that actually work.
              </p>

              <h2>Primary Techniques</h2>
              <ul>
                <li>
                  <strong>The Sad Eyes Method</strong> - Sit near food bowl,
                  stare longingly
                </li>
                <li>
                  <strong>Strategic Meowing</strong> - Begin at 5 AM for maximum
                  effectiveness
                </li>
                <li>
                  <strong>Bowl Inspection</strong> - Loudly inspect empty bowl,
                  then stare at human
                </li>
                <li>
                  <strong>The Figure Eight</strong> - Weave between their legs
                  while they cook
                </li>
              </ul>

              <h2>Advanced Protocol</h2>
              <p>
                For optimal results, combine multiple techniques. The most
                successful combination involves the Sad Eyes Method followed
                immediately by Strategic Meowing.
              </p>

              <div className="relative my-1">
                <div className="absolute top-2 right-2 z-10">
                  <CodeCopyButton
                    text={`function acquireFood() {
  while (bowl.isEmpty()) {
    meow();
    rubAgainstLegs();
    if (human.isInKitchen) {
      stareIntently();
    }
  }
}`}
                  />
                </div>
                <pre className="pt-10">
                  <code>
                    {`function acquireFood() {
  while (bowl.isEmpty()) {
    meow();
    rubAgainstLegs();
    if (human.isInKitchen) {
      stareIntently();
    }
  }
}`}
                  </code>
                </pre>
              </div>

              <h2>Common Mistakes to Avoid</h2>
              <ol>
                <li>Never accept the first "no" - persistence is key</li>
                <li>
                  Maintain consistency in meal times (your schedule, not theirs)
                </li>
                <li>Don't forget to knock things off counters periodically</li>
              </ol>

              <p>
                Remember: <em>humans are trainable</em>. With dedication and the
                right approach, you can increase portions by up to 40% within
                the first month.
              </p>
            </div>
          </div>
          {/* Fade overlay - content to muted background */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-bg to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Custom CSS Section */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-1">{t("Custom CSS")}</h2>
        <p className="text-sm text-text-muted mb-3">
          {t(
            "Applied on top of the app styles. Theme colors are CSS variables such as --color-bg or --color-accent; use !important to override them.",
          )}
        </p>
        <Textarea
          value={customCss}
          onChange={(e) => setCustomCss(e.target.value)}
          placeholder={
            ":root {\n  --color-bg: #1e1e2e !important;\n  --color-accent: #cba6f7 !important;\n}\n\n.prose h1 {\n  letter-spacing: -0.02em;\n}"
          }
          rows={10}
          spellCheck={false}
          aria-label={t("Custom CSS")}
          className="font-mono text-xs resize-y"
        />
        {customCss && (
          <Button
            onClick={() => setCustomCss("")}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            {t("Clear custom CSS")}
          </Button>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Editing Section */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-3">{t("Editing")}</h2>
        <div className="rounded-[10px] border border-border pl-4 py-3 pr-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm text-text font-medium">{t("Paste mode")}</label>
              <span className="text-xs text-text-muted">
                {t(
                  pasteModeOptions.find((o) => o.value === pasteMode)
                    ?.description ?? pasteModeOptions[0].description,
                )}
              </span>
            </div>
            <Select
              value={pasteMode}
              onChange={(e) => setPasteMode(e.target.value as PasteMode)}
              className="w-40"
            >
              {pasteModeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}

// Expandable subsection for customizing colors for a single theme mode
function ColorsExpandable({
  label,
  mode,
  customColors,
  setCustomColor,
  resetCustomColor,
  resetAllCustomColors,
  className,
}: {
  label: string;
  mode: "light" | "dark";
  customColors: Partial<Record<ThemeColorKey, string>>;
  setCustomColor: (
    mode: "light" | "dark",
    key: ThemeColorKey,
    value: string,
  ) => void;
  resetCustomColor: (mode: "light" | "dark", key: ThemeColorKey) => void;
  resetAllCustomColors: (mode: "light" | "dark") => void;
  className?: string;
}) {
  const t = useT();
  const defaults = defaultThemeColors[mode];
  const hasAnyCustom = Object.keys(customColors).length > 0;

  return (
    <details className={cn("text-sm", className)}>
      <summary className="cursor-pointer text-text-muted hover:text-text select-none flex items-center gap-1 font-medium">
        <ChevronRightIcon className="w-3.5 h-3.5 stroke-2 transition-transform [[open]>&]:rotate-90" />
        {label}
        {hasAnyCustom && (
          <Button
            onClick={(e) => {
              e.preventDefault();
              resetAllCustomColors(mode);
            }}
            variant="ghost"
            size="sm"
            className="ml-auto"
          >
            {t("Reset all")}
          </Button>
        )}
      </summary>
      <div className="mt-2 rounded-[10px] border border-border pl-4 py-3 pr-3 space-y-1.5">
        {(() => {
          let lastGroup = "";
          return colorLabels.map(({ key, label: colorLabel, group }) => {
            const showGroup = group !== lastGroup;
            lastGroup = group;
            return (
              <div key={key}>
                {showGroup && (
                  <div
                    className={`text-base text-text-muted font-medium ${key !== colorLabels[0].key ? "mt-6" : ""} mb-2.5`}
                  >
                    {t(group)}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-text font-medium">
                    {t(colorLabel)}
                  </label>
                  <ColorPicker
                    color={customColors[key] ?? defaults[key]}
                    defaultColor={defaults[key]}
                    onChange={(value) => setCustomColor(mode, key, value)}
                    onReset={() => resetCustomColor(mode, key)}
                  />
                </div>
              </div>
            );
          });
        })()}
      </div>
    </details>
  );
}
