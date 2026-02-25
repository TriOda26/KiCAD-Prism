import { FolderPlus, Grid3X3, List, Plus, RefreshCw, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ViewMode } from "./workspace-types";

interface WorkspaceProjectToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onImport: () => void;
  onCreateFolder: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export function WorkspaceProjectToolbar({
  viewMode,
  onViewModeChange,
  onImport,
  onCreateFolder,
  onRefresh,
  onOpenSettings,
}: WorkspaceProjectToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:h-14 md:flex-nowrap md:py-0">
      <div className="inline-flex rounded-md border p-1">
        <Button
          variant={viewMode === "gallery" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("gallery")}
        >
          <Grid3X3 className="mr-2 h-4 w-4" />
          Gallery
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("list")}
        >
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button onClick={onImport}>
          <Plus className="mr-2 h-4 w-4" />
          Import Project
        </Button>
        <Button variant="outline" size="icon" onClick={onCreateFolder} aria-label="Create new folder">
          <FolderPlus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh workspace">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onOpenSettings} aria-label="Open settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
