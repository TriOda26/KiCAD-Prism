import { useState } from "react";
import { Folder, FolderOpen, ChevronRight, ChevronDown, MoreVertical, Plus, Pencil, Trash2, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { FolderTreeItem, Project } from "@/types/project";

interface FolderTreeItemProps {
  folder: FolderTreeItem;
  allFolders: FolderTreeItem[];  // All folders flat list for move menu
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (project: Project) => void;
  onCreateSubfolder: (parentFolderId: string, parentFolderName: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string, folderName: string) => void;
  onMoveProjectToFolder: (projectId: string, folderId: string | null) => void;
  depth?: number;
}

export function FolderTreeItemComponent({
  folder,
  allFolders,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveProjectToFolder,
  depth = 0,
}: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(folder.expanded ?? true);
  const hasChildren = folder.children.length > 0;
  const folderProjects = projects.filter(p => p.folder_id === folder.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group",
          depth === 0 && "mt-2"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/Collapse button - Larger and visible */}
        <button
          onClick={handleToggle}
          className={cn(
            "w-6 h-6 shrink-0 flex items-center justify-center rounded-md transition-colors",
            "hover:bg-accent hover:text-foreground",
            hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground font-bold" strokeWidth={2.5} />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground font-bold" strokeWidth={2.5} />
            )
          ) : null}
        </button>

        {/* Folder icon - Larger */}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-yellow-500" />
        )}

        {/* Folder name */}
        <span className="flex-1 text-sm font-medium truncate">
          {folder.name}
        </span>

        {/* Project count badge */}
        {folderProjects.length > 0 && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {folderProjects.length}
          </span>
        )}

        {/* Folder actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onCreateSubfolder(folder.id, folder.name)}>
              <Plus className="h-3 w-3 mr-2" />
              New Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameFolder(folder.id, folder.name)}>
              <Pencil className="h-3 w-3 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeleteFolder(folder.id, folder.name)}
              className="text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div>
          {/* Subfolders */}
          {folder.children.map(subfolder => (
            <FolderTreeItemComponent
              key={subfolder.id}
              folder={subfolder}
              allFolders={allFolders}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
              onCreateSubfolder={onCreateSubfolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveProjectToFolder={onMoveProjectToFolder}
              depth={depth + 1}
            />
          ))}

          {/* Projects in this folder */}
          {folderProjects.map(project => (
            <div
              key={project.id}
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group",
                selectedProjectId === project.id && "bg-accent"
              )}
              style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
            >
              <div
                className="flex items-center gap-2 flex-1 min-w-0"
                onClick={() => onSelectProject(project)}
              >
                <FileUp className={cn(
                  "h-4 w-4 shrink-0",
                  selectedProjectId === project.id ? "text-foreground" : "text-green-500"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate font-medium">
                    {project.display_name || project.name}
                  </div>
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
                      <DropdownMenuItem onClick={() => onMoveProjectToFolder(project.id, null)}>
                        <span className="text-xs">→ Root (no folder)</span>
                      </DropdownMenuItem>
                      {allFolders
                        .filter(f => f.id !== folder.id) // Don't show current folder
                        .map(f => (
                          <DropdownMenuItem
                            key={f.id}
                            onClick={() => onMoveProjectToFolder(project.id, f.id)}
                          >
                            <Folder className="h-3 w-3 mr-2" />
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
    </div>
  );
}
