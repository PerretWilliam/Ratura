import { forwardRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useT } from "../../i18n";

interface NoteTitleInputProps {
  noteId: string;
  title: string;
  onRename: (id: string, newName: string) => Promise<void>;
  /** Moves the caret into the note body (Enter / ArrowDown / Escape). */
  onExit: () => void;
}

// The note's name is its file name: editing it renames the file.
export const NoteTitleInput = forwardRef<HTMLInputElement, NoteTitleInputProps>(
  function NoteTitleInput({ noteId, title, onRename, onExit }, ref) {
    const t = useT();
    const [value, setValue] = useState(title);
    // Escape blurs synchronously, before the reverted value re-renders
    const cancelledRef = useRef(false);

    useEffect(() => {
      setValue(title);
    }, [noteId, title]);

    const commit = async () => {
      const next = value.trim();
      if (cancelledRef.current || !next || next === title) {
        cancelledRef.current = false;
        setValue(title);
        return;
      }
      try {
        await onRename(noteId, next);
      } catch (error) {
        setValue(title);
        toast.error(error instanceof Error ? error.message : String(error));
      }
    };

    return (
      <input
        ref={ref}
        data-note-name-input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancelledRef.current = true;
          if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "Escape") {
            e.preventDefault();
            onExit();
          }
        }}
        spellCheck={false}
        aria-label={t("Note name")}
        placeholder={t("Untitled")}
        className="block w-full mx-auto px-6 pt-8 bg-transparent text-text text-3xl font-semibold leading-tight focus:outline-none placeholder:text-text-muted"
        style={{ maxWidth: "var(--editor-max-width, 48rem)" }}
      />
    );
  },
);
