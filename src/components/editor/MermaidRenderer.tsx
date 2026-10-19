import { useMemo } from "react";
import { renderMermaidSVG } from "beautiful-mermaid";
import { useT } from "../../i18n";

interface MermaidRendererProps {
  code: string;
}

export function MermaidRenderer({ code }: MermaidRendererProps) {
  const t = useT();
  const { svg, error } = useMemo(() => {
    if (!code.trim()) return { svg: null, error: null };
    try {
      return {
        svg: renderMermaidSVG(code.trim(), {
          bg: "var(--color-bg)",
          fg: "var(--color-text)",
          muted: "var(--color-text-muted)",
          border: "var(--color-border)",
          transparent: true,
        }),
        error: null,
      };
    } catch (err) {
      return {
        svg: null,
        error: err instanceof Error ? err.message : t("Invalid mermaid syntax"),
      };
    }
  }, [code, t]);

  if (error) {
    return (
      <div className="text-xs text-text-muted italic px-2 pt-6 pb-3 text-center">
        {t("Mermaid syntax error")}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="text-xs text-text-muted italic px-2 pt-6 pb-3 text-center">
        {t("Empty mermaid diagram")}
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram flex justify-center py-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
