import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";

import { FolderTreeItem, Project } from "@/types/project";
import { ImportDialog } from "./import-dialog";
import { SettingsDialog } from "./settings-dialog";
import { Button } from "@/components/ui/button";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { useWorkspaceSearch } from "@/hooks/use-workspace-search";

import { CreateFolderDialog } from "./workspace/create-folder-dialog";
import { DeleteFolderDialog } from "./workspace/delete-folder-dialog";
import { DeleteProjectDialog } from "./workspace/delete-project-dialog";
import { MoveProjectDialog } from "./workspace/move-project-dialog";
import { RenameFolderDialog } from "./workspace/rename-folder-dialog";
import { WorkspaceAppsPlaceholder } from "./workspace/workspace-apps-placeholder";
import { WorkspaceBreadcrumbs } from "./workspace/workspace-breadcrumbs";
import { WorkspaceGalleryView } from "./workspace/workspace-gallery-view";
import { WorkspaceListView } from "./workspace/workspace-list-view";
import { WorkspaceLoadingState } from "./workspace/workspace-loading-state";
import { WorkspaceProjectToolbar } from "./workspace/workspace-project-toolbar";
import { WorkspaceSidebar } from "./workspace/workspace-sidebar";
import { WorkspaceSection, ViewMode } from "./workspace/workspace-types";

interface WorkspaceProps {
  searchQuery: string;
}

export function Workspace({ searchQuery }: WorkspaceProps) {
  const navigate = useNavigate();

  const { projects, folders, loading, error, folderById, refresh, createFolder, renameFolder, deleteFolder, moveProject, deleteProject } =
    useWorkspaceData();

  const [section, setSection] = useState<WorkspaceSection>("projects");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [folderToRename, setFolderToRename] = useState<FolderTreeItem | null>(null);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  const [folderToDelete, setFolderToDelete] = useState<FolderTreeItem | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  const [projectToMove, setProjectToMove] = useState<Project | null>(null);
  const [isMovingProject, setIsMovingProject] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const getProjectDisplayName = (project: Project) => project.display_name || project.name;

  useEffect(() => {
    if (currentFolderId && !folderById.has(currentFolderId)) {
      setCurrentFolderId(null);
    }
  }, [currentFolderId, folderById]);

  const visibleFolders = useMemo(() => {
    return folders
      .filter((folder) => (folder.parent_id ?? null) === currentFolderId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [folders, currentFolderId]);

  const visibleProjects = useMemo(() => {
    return projects
      .filter((project) => (project.folder_id ?? null) === currentFolderId)
      .sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name));
  }, [projects, currentFolderId]);

  const { isSearching, searchResults } = useWorkspaceSearch(projects, folderById, searchQuery);

  const breadcrumbs = useMemo(() => {
    const trail: FolderTreeItem[] = [];
    let activeId = currentFolderId;
    let guard = 0;

    while (activeId && guard < 64) {
      const folder = folderById.get(activeId);
      if (!folder) {
        break;
      }
      trail.unshift(folder);
      activeId = folder.parent_id ?? null;
      guard += 1;
    }

    return trail;
  }, [currentFolderId, folderById]);

  const listFolders = isSearching ? [] : visibleFolders;
  const listProjects = isSearching ? searchResults : visibleProjects;

  const openProject = (project: Project) => {
    navigate(`/project/${project.id}`);
  };

  const handleCreateFolder = async (name: string) => {
    setIsCreatingFolder(true);
    try {
      const result = await createFolder(name, currentFolderId);
      if (!result.ok) {
        toast.error(result.error || "Failed to create folder");
        return;
      }

      toast.success("Folder created");
      setIsCreateFolderOpen(false);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    setIsRenamingFolder(true);
    try {
      const result = await renameFolder(folderId, name);
      if (!result.ok) {
        toast.error(result.error || "Failed to rename folder");
        return;
      }

      toast.success("Folder renamed");
      setFolderToRename(null);
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setIsDeletingFolder(true);
    try {
      const deletedFolderName = folderToDelete?.name || "folder";
      const result = await deleteFolder(folderId);
      if (!result.ok) {
        toast.error(result.error || "Failed to delete folder");
        return;
      }

      toast.success(`Deleted folder "${deletedFolderName}"`);
      setFolderToDelete(null);
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const handleMoveProject = async (projectId: string, folderId: string | null) => {
    setIsMovingProject(true);
    try {
      const movedProjectName = projectToMove ? getProjectDisplayName(projectToMove) : "project";
      const result = await moveProject(projectId, folderId);
      if (!result.ok) {
        toast.error(result.error || "Failed to move project");
        return;
      }

      toast.success(`Moved "${movedProjectName}"`);
      setProjectToMove(null);
    } finally {
      setIsMovingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setIsDeletingProject(true);
    try {
      const deletedProjectName = projectToDelete ? getProjectDisplayName(projectToDelete) : "project";
      const result = await deleteProject(projectId);
      if (!result.ok) {
        toast.error(result.error || "Failed to delete project");
        return;
      }

      toast.success(`Deleted "${deletedProjectName}"`);
      setProjectToDelete(null);
    } finally {
      setIsDeletingProject(false);
    }
  };

  if (error) {
    return <div className="flex h-64 items-center justify-center rounded-xl border text-destructive">{error}</div>;
  }

  return (
    <>
      <div className="flex h-full min-h-0 w-full overflow-hidden border bg-background">
        <WorkspaceSidebar
          section={section}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((previous) => !previous)}
          onSectionChange={setSection}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b">
            <div className="flex h-12 items-center gap-3 px-4 sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed((previous) => !previous)}
                aria-label="Toggle sidebar"
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>

            {section === "projects" && (
              <WorkspaceProjectToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onImport={() => setIsImportOpen(true)}
                onCreateFolder={() => setIsCreateFolderOpen(true)}
                onRefresh={() => void refresh()}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <WorkspaceLoadingState />
            ) : section === "apps" ? (
              <WorkspaceAppsPlaceholder />
            ) : (
              <div className="space-y-6 p-6">
                <WorkspaceBreadcrumbs
                  isSearching={isSearching}
                  breadcrumbs={breadcrumbs}
                  viewMode={viewMode}
                  onGoRoot={() => setCurrentFolderId(null)}
                  onSelectFolder={setCurrentFolderId}
                />

                {viewMode === "gallery" ? (
                  <WorkspaceGalleryView
                    searchQuery={searchQuery}
                    isSearching={isSearching}
                    searchResults={searchResults}
                    currentFolderId={currentFolderId}
                    visibleFolders={visibleFolders}
                    visibleProjects={visibleProjects}
                    getProjectDisplayName={getProjectDisplayName}
                    onOpenProject={openProject}
                    onOpenFolder={setCurrentFolderId}
                    onRenameFolder={setFolderToRename}
                    onDeleteFolder={setFolderToDelete}
                    onMoveProject={setProjectToMove}
                    onDeleteProject={setProjectToDelete}
                  />
                ) : (
                  <WorkspaceListView
                    isSearching={isSearching}
                    currentFolderId={currentFolderId}
                    breadcrumbs={breadcrumbs}
                    listFolders={listFolders}
                    listProjects={listProjects}
                    getProjectDisplayName={getProjectDisplayName}
                    onOpenProject={openProject}
                    onOpenFolder={setCurrentFolderId}
                    onRenameFolder={setFolderToRename}
                    onDeleteFolder={setFolderToDelete}
                    onMoveProject={setProjectToMove}
                    onDeleteProject={setProjectToDelete}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImportComplete={refresh} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <CreateFolderDialog
        open={isCreateFolderOpen}
        isSubmitting={isCreatingFolder}
        onOpenChange={setIsCreateFolderOpen}
        onSubmit={handleCreateFolder}
      />
      <RenameFolderDialog
        folder={folderToRename}
        isSubmitting={isRenamingFolder}
        onClose={() => setFolderToRename(null)}
        onSubmit={handleRenameFolder}
      />
      <DeleteFolderDialog
        folder={folderToDelete}
        isDeleting={isDeletingFolder}
        onClose={() => setFolderToDelete(null)}
        onConfirm={handleDeleteFolder}
      />
      <MoveProjectDialog
        project={projectToMove}
        folders={folders}
        isMoving={isMovingProject}
        onClose={() => setProjectToMove(null)}
        onConfirm={handleMoveProject}
        getProjectDisplayName={getProjectDisplayName}
      />
      <DeleteProjectDialog
        project={projectToDelete}
        isDeleting={isDeletingProject}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
        getProjectDisplayName={getProjectDisplayName}
      />
    </>
  );
}
