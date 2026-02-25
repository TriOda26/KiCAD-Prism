import { Folder } from "lucide-react";

import { SearchProject } from "@/hooks/use-workspace-search";
import { FolderTreeItem, Project } from "@/types/project";

import { FolderActionMenu, ProjectActionMenu } from "./workspace-action-menus";

interface WorkspaceListViewProps {
  isSearching: boolean;
  currentFolderId: string | null;
  breadcrumbs: FolderTreeItem[];
  listFolders: FolderTreeItem[];
  listProjects: Project[];
  getProjectDisplayName: (project: Project) => string;
  onOpenProject: (project: Project) => void;
  onOpenFolder: (folderId: string) => void;
  onRenameFolder: (folder: FolderTreeItem) => void;
  onDeleteFolder: (folder: FolderTreeItem) => void;
  onMoveProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

function resolveProjectLocation(
  project: Project,
  isSearching: boolean,
  currentFolderId: string | null,
  breadcrumbs: FolderTreeItem[]
): string {
  if (isSearching && "folder_path" in project) {
    return (project as SearchProject).folder_path;
  }

  if (currentFolderId) {
    return breadcrumbs.map((crumb) => crumb.name).join(" / ");
  }

  return "Workspace Root";
}

export function WorkspaceListView({
  isSearching,
  currentFolderId,
  breadcrumbs,
  listFolders,
  listProjects,
  getProjectDisplayName,
  onOpenProject,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveProject,
  onDeleteProject,
}: WorkspaceListViewProps) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] border-b bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <div>Name</div>
        <div>Description</div>
        <div>Location</div>
        <div>Updated</div>
        <div className="w-8" />
      </div>

      {listFolders.length === 0 && listProjects.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">No items to display.</div>
      ) : (
        <div>
          {listFolders.map((folder) => (
            <div
              key={folder.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center border-b px-4 py-2"
            >
              <button
                type="button"
                className="flex min-w-0 items-center gap-2 text-left text-sm font-medium hover:text-primary"
                onClick={() => onOpenFolder(folder.id)}
              >
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{folder.name}</span>
              </button>
              <p className="truncate text-sm text-muted-foreground">Folder</p>
              <p className="truncate text-sm text-muted-foreground">Current Level</p>
              <p className="truncate text-sm text-muted-foreground">-</p>
              <div className="flex justify-end">
                <FolderActionMenu folder={folder} onRename={onRenameFolder} onDelete={onDeleteFolder} />
              </div>
            </div>
          ))}

          {listProjects.map((project) => (
            <div
              key={project.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center border-b px-4 py-2"
            >
              <button
                type="button"
                className="truncate text-left text-sm font-medium hover:text-primary"
                onClick={() => onOpenProject(project)}
              >
                {getProjectDisplayName(project)}
              </button>
              <p className="truncate text-sm text-muted-foreground">{project.description || "No description"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {resolveProjectLocation(project, isSearching, currentFolderId, breadcrumbs)}
              </p>
              <p className="truncate text-sm text-muted-foreground">{project.last_modified}</p>
              <div className="flex justify-end">
                <ProjectActionMenu
                  project={project}
                  projectName={getProjectDisplayName(project)}
                  onMove={onMoveProject}
                  onDelete={onDeleteProject}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
