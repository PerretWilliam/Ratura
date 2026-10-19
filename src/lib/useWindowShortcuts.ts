import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { resolveWindowShortcut } from "./windowShortcuts";
import { t as tNow } from "../i18n";

interface UseWindowShortcutsOptions {
  onOpenPreferences: () => void | Promise<void>;
}

export function useWindowShortcuts({
  onOpenPreferences,
}: UseWindowShortcutsOptions): void {
  const { interfaceZoom, setInterfaceZoom } = useTheme();
  const interfaceZoomRef = useRef(interfaceZoom);
  interfaceZoomRef.current = interfaceZoom;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = resolveWindowShortcut(event);
      if (!action) return;
      event.preventDefault();

      if (action === "preferences") {
        void Promise.resolve(onOpenPreferences()).catch((error) => {
          console.error("Failed to open preferences:", error);
          toast.error(tNow("Failed to open preferences"));
        });
        return;
      }

      if (action === "zoom-reset") {
        interfaceZoomRef.current = 1;
        setInterfaceZoom(1);
        toast(tNow("Zoom {percent}%", { percent: 100 }), { id: "zoom", duration: 1500 });
        return;
      }

      const delta = action === "zoom-in" ? 0.05 : -0.05;
      const next = Math.round(
        Math.min(Math.max(interfaceZoomRef.current + delta, 0.7), 1.5) * 20,
      ) / 20;
      interfaceZoomRef.current = next;
      setInterfaceZoom((current) => current + delta);
      toast(tNow("Zoom {percent}%", { percent: Math.round(next * 100) }), {
        id: "zoom",
        duration: 1500,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenPreferences, setInterfaceZoom]);
}
