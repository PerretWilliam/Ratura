import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui";
import { Input } from "../ui";
import { useT } from "../../i18n";

interface FolderNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  defaultValue?: string;
}

export function FolderNameDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  defaultValue = "",
}: FolderNameDialogProps) {
  const t = useT();
  title ??= t("Create New Folder");
  description ??= t("Enter a name for your new folder");
  confirmLabel ??= t("Create");
  const [name, setName] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(defaultValue);
      // Auto-focus with delay to ensure dialog is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, defaultValue]);

  const handleConfirm = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  }, [name, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="-mt-1">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("Folder name")}
          className="mt-1"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!name.trim()}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
