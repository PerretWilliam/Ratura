import { open } from "@tauri-apps/plugin-dialog";
import { useNotes } from "../../context/NotesContext";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui";
import { isWindows } from "../../lib/platform";
import { useT } from "../../i18n";

export function FolderPicker() {
  const t = useT();
  const { setNotesFolder } = useNotes();
  const { reloadSettings } = useTheme();

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t("Choose Notes Folder"),
      });

      if (selected && typeof selected === "string") {
        await setNotesFolder(selected);
        // Reload theme/font settings from the new folder's .ratura/settings.json
        await reloadSettings();
      }
    } catch (err) {
      console.error("Failed to select folder:", err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* Draggable title bar area */}
      {!isWindows && <div className="h-10 shrink-0" data-tauri-drag-region />}

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 max-w-lg select-none">
          <div
            role="img"
            aria-label={t("Folders")}
            className="w-48 aspect-square mx-auto mb-2 opacity-40 animate-fade-in-up"
            style={{
              animationDelay: "0ms",
              backgroundColor: "var(--color-text)",
              WebkitMaskImage: "url(/folders-dark.png)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url(/folders-dark.png)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
            }}
          />

          <h1
            className="text-3xl text-text font-serif mb-2 tracking-[-0.01em] animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            {t("Welcome to Ratura")}
          </h1>
          <p
            className="text-text-muted mb-6 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            {t("Ratura is an offline-first notes app. Your notes are simply stored on your computer as markdown files.")}
          </p>
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <Button onClick={handleSelectFolder} size="xl">
              {t("Choose your notes folder")}
            </Button>
          </div>

          <p
            className="mt-2 text-xs text-text-muted/60 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            {t("You can change this later")}
          </p>
        </div>
      </div>
    </div>
  );
}
