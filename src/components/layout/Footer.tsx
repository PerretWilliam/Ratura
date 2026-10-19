import { useCallback, memo } from "react";
import { toast } from "sonner";
import { useGit } from "../../context/GitContext";
import { Button, IconButton, Tooltip } from "../ui";
import {
  GitBranchIcon,
  GitBranchDeletedIcon,
  GitCommitIcon,
  RefreshCwIcon,
  SpinnerIcon,
  SettingsIcon,
} from "../icons";
import { cn } from "../../lib/utils";
import { mod, isMac } from "../../lib/platform";
import { useT } from "../../i18n";

interface FooterProps {
  onOpenSettings?: () => void;
  onOpenCommit?: () => void;
}

export const Footer = memo(function Footer({
  onOpenSettings,
  onOpenCommit,
}: FooterProps) {
  const t = useT();
  const {
    status,
    isLoading,
    isSyncing,
    isCommitting,
    gitAvailable,
    gitEnabled,
    sync,
    initRepo,
    lastError,
    clearError,
  } = useGit();

  const handleCommit = useCallback(() => {
    onOpenCommit?.();
  }, [onOpenCommit]);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    const result = await sync();
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  }, [sync, isSyncing]);

  const handleEnableGit = useCallback(async () => {
    const success = await initRepo();
    if (success) {
      toast.success(t("Git repository initialized"));
    } else {
      toast.error(t("Failed to initialize Git"));
    }
  }, [initRepo]);

  // Git status section
  const renderGitStatus = () => {
    if (!gitEnabled || !gitAvailable) {
      return null;
    }

    // Not a git repo - show init option
    if (status && !status.isRepo) {
      return (
        <Tooltip content={t("Initialize Git repository")}>
          <Button
            onClick={handleEnableGit}
            variant="ghost"
            className="text-xs h-auto p-0 hover:bg-transparent"
          >
            {t("Enable Git")}
          </Button>
        </Tooltip>
      );
    }

    // Show spinner only when loading and no error to display
    if (isLoading && !lastError) {
      return <SpinnerIcon className="w-3 h-3 text-text-muted animate-spin" />;
    }

    const hasChanges = status ? status.changedCount > 0 : false;

    return (
      <div className="flex items-center gap-1.5">
        {/* Branch icon with name on hover */}
        {status?.currentBranch ? (
          <Tooltip content={t("Branch: {branch}", { branch: status.currentBranch })}>
            <span className="text-text-muted flex items-center">
              <GitBranchIcon className="w-4.5 h-4.5 stroke-[1.5]" />
            </span>
          </Tooltip>
        ) : status ? (
          <Tooltip content={t("No branch (set up git in settings)")}>
            <span className="text-text-muted flex items-center">
              <GitBranchDeletedIcon className="w-4.5 h-4.5 stroke-[1.5] opacity-50" />
            </span>
          </Tooltip>
        ) : null}

        {/* Changes indicator — hidden when there's an error so we don't show a stale count alongside it */}
        {hasChanges && !lastError && (
          <Tooltip content={t("You have uncommitted changes")}>
            <span className="text-xs text-text-muted/70">{t("Files changed")}</span>
          </Tooltip>
        )}

        {/* Error indicator */}
        {lastError && (
          <Tooltip content={lastError}>
            <Button
              onClick={clearError}
              variant="link"
              className="text-xs h-auto p-0 text-red-500 hover:text-red-600 hover:no-underline"
            >
              {t("An error occurred")}
            </Button>
          </Tooltip>
        )}
      </div>
    );
  };

  // Determine what buttons to show
  const hasChanges = (status?.changedCount ?? 0) > 0;
  const showCommitButton =
    gitEnabled && gitAvailable && status?.isRepo && hasChanges;
  const behindCount = Math.max(status?.behindCount ?? 0, 0);
  const aheadCount = Math.max(status?.aheadCount ?? 0, 0);
  const syncCount = behindCount + aheadCount;
  const showSyncButton =
    gitEnabled && gitAvailable && status?.hasRemote && status?.hasUpstream;

  const syncTooltip = isSyncing
    ? t("Syncing...")
    : behindCount > 0 && aheadCount > 0
      ? t("{pull} to pull, {push} to push", { pull: behindCount, push: aheadCount })
      : behindCount > 0
        ? t("Commits to pull: {count}", { count: behindCount })
        : aheadCount > 0
          ? t("Commits to push: {count}", { count: aheadCount })
          : t("Synced with remote");

  const hasGitFooterContent =
    showCommitButton || showSyncButton || renderGitStatus() !== null;

  // When there's no git content, show a floating settings button
  if (!hasGitFooterContent) {
    return (
      <div className="absolute bottom-3 right-3">
        <IconButton
          onClick={onOpenSettings}
          title={t("Settings ({shortcut} to toggle)", { shortcut: `${mod}${isMac ? "" : "+"},` })}
          className="rounded-lg bg-bg-secondary border border-border hover:bg-bg-muted backdrop-blur-sm w-8 h-8"
        >
          <SettingsIcon className="w-4.5 h-4.5 stroke-[1.5]" />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border">
      {/* Footer bar with git status and action buttons */}
      <div className="pl-4 pr-3 pt-2 pb-2.5 flex items-center justify-between">
        {renderGitStatus()}
        <div className="flex items-center gap-px">
          {/* Sync button — pulls then pushes, always visible when upstream is configured */}
          {showSyncButton && (
            <Tooltip content={syncTooltip}>
              <IconButton
                onClick={handleSync}
                disabled={isSyncing}
                aria-label={t("Sync")}
              >
                {isSyncing ? (
                  <SpinnerIcon className="w-4.5 h-4.5 stroke-[1.5] animate-spin" />
                ) : (
                  <span className="relative flex items-center">
                    <RefreshCwIcon
                      className={cn(
                        "w-4.5 h-4.5 stroke-[1.5]",
                        syncCount === 0 && "opacity-50",
                      )}
                    />
                    {syncCount > 0 && (
                      <span className="absolute -top-1.25 -right-1.25 min-w-3.5 h-3.5 flex items-center justify-center rounded-full bg-accent text-text-inverse text-[9px] font-bold leading-none px-0.5">
                        {syncCount}
                      </span>
                    )}
                  </span>
                )}
              </IconButton>
            </Tooltip>
          )}
          {showCommitButton && (
            <IconButton
              onClick={handleCommit}
              disabled={isCommitting}
              title={t("Commit Changes")}
            >
              {isCommitting ? (
                <SpinnerIcon className="w-4.5 h-4.5 stroke-[1.5] animate-spin" />
              ) : (
                <GitCommitIcon className="w-4.5 h-4.5 stroke-[1.5]" />
              )}
            </IconButton>
          )}
          <IconButton
            onClick={onOpenSettings}
            title={t("Settings ({shortcut} to toggle)", { shortcut: `${mod}${isMac ? "" : "+"},` })}
          >
            <SettingsIcon className="w-4.5 h-4.5 stroke-[1.5]" />
          </IconButton>
        </div>
      </div>
    </div>
  );
});
