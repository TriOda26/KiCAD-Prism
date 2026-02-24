import { useState, useEffect } from "react";
import { CircuitBoard, FolderPlus, FolderOpen, MoreVertical, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderTreeItemComponent } from "./folder-tree-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, FolderTreeItem } from "@/types/project";

interface SidebarTreeProps {
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (project: Project) => void;
  onCreateFolder: (parentFolderId?: string | null, parentFolderName?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string, folderName: string) => void;
  onMoveProjectToFolder: (projectId: string, folderId: string | null) => void;
}

export function SidebarTree({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveProjectToFolder,
}: SidebarTreeProps) {
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [rootProjects, setRootProjects] = useState<Project[]>([]);
  const [expandedAll, setExpandedAll] = useState(true);

  useEffect(() => {
    // Fetch folder tree structure
    fetch("/api/projects/folders")
      .then(res => res.json())
      .then(data => setFolders(data))
      .catch(() => setFolders([]));
  }, []);

  useEffect(() => {
    // Filter projects that are not in any folder (root level)
    setRootProjects(projects.filter(p => !p.folder_id));
  }, [projects]);

  const allProjectsCount = projects.length;
  const rootProjectsCount = rootProjects.length;
  const folderProjectsCount = allProjectsCount - rootProjectsCount;

  return (
    <div className="h-full flex flex-col">
      {/* Folders Section */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2" style={{ scrollbarWidth: 'thin' }}>
        {/* All Projects (virtual folder) */}
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors mb-2",
            !selectedProjectId && expandedAll && "bg-accent"
          )}
          onClick={() => setExpandedAll(!expandedAll)}
        >
          {expandedAll ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          )}
          <span className="flex-1 text-sm font-medium">All Projects</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {allProjectsCount}
          </span>
        </div>

        {/* Create Folder Button */}
        <div className="px-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={onCreateFolder}
          >
            <FolderPlus className="h-3 w-3 mr-2" />
            New Folder
          </Button>
        </div>

        {/* Folder Tree */}
        {folders.length > 0 && expandedAll && (
          <div className="space-y-0.5">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Folders ({folderProjectsCount})
            </div>
            {folders.map(folder => (
              <FolderTreeItemComponent
                key={folder.id}
                folder={folder}
                allFolders={folders}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={onSelectProject}
                onCreateSubfolder={(parentId, parentName) => onCreateFolder(parentId, parentName)}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                onMoveProjectToFolder={onMoveProjectToFolder}
                depth={0}
              />
            ))}
          </div>
        )}

        {/* Root Projects (not in any folder) */}
        {rootProjects.length > 0 && expandedAll && (
          <div className="space-y-0.5 mt-4">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Unsorted ({rootProjects.length})
            </div>
            {rootProjects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group",
                  selectedProjectId === project.id && "bg-accent"
                )}
              >
                <div
                  className="flex items-center gap-2 flex-1 min-w-0"
                  onClick={() => onSelectProject(project)}
                >
                  <CircuitBoard className={cn(
                    "h-4 w-4 shrink-0",
                    selectedProjectId === project.id ? "text-foreground" : "text-green-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate font-medium">
                      {project.display_name || project.name}
                    </div>
                    {project.parent_repo && (
                      <div className="text-[10px] text-muted-foreground truncate leading-tight group-hover:text-muted-foreground/80">
                        {project.parent_repo}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Project actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {/* Move to folder submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FileUp className="h-4 w-4 mr-2" />
                        Move to Folder
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {folders.map(f => (
                          <DropdownMenuItem
                            key={f.id}
                            onClick={() => onMoveProjectToFolder(project.id, f.id)}
                          >
                            <FolderOpen className="h-3 w-3 mr-2" />
                            {f.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {folders.length === 0 && rootProjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No projects found</p>
            <p className="text-xs mt-1">Import a project to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
