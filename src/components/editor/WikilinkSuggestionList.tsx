import { forwardRef } from "react";
import { useT } from "../../i18n";
import type { NoteMetadata } from "../../types/note";
import {
  SuggestionList,
  type SuggestionListRef,
} from "./SuggestionList";

export type WikilinkSuggestionListRef = SuggestionListRef;

interface WikilinkSuggestionListProps {
  items: NoteMetadata[];
  command: (item: NoteMetadata) => void;
}

export const WikilinkSuggestionList = forwardRef<
  WikilinkSuggestionListRef,
  WikilinkSuggestionListProps
>(function WikilinkSuggestionList({ items, command }, ref) {
  const t = useT();
  return (
  <SuggestionList
    ref={ref}
    items={items}
    command={command}
    itemKey={(item) => item.id}
    width="w-72"
    emptyText={t("No matching notes")}
    renderItem={(item) => (
      <div className="flex flex-col min-w-0">
        <span className="text-sm leading-snug font-medium truncate">
          {item.title}
        </span>
        {item.preview && (
          <span className="text-xs text-text-muted truncate mt-0.5">
            {item.preview}
          </span>
        )}
      </div>
    )}
  />
  );
});
WikilinkSuggestionList.displayName = "WikilinkSuggestionList";
