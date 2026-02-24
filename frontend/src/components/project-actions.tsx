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
import { Button } from "@/components/ui/button";
import { MoreVertical, FolderInput, Folder, ExternalLink } from "lucide-react";
import type { FolderTreeItem, Project } from "@/types/project";

interface ProjectActionsProps {
  project: Project;
  folders: FolderTreeItem[];
  onMoveToFolder: (projectId: string, folderId: string | null) => void;
  onDelete: (project: Project) => void;
  children?: React.ReactNode;
}

export function ProjectActions({
  project,
  folders,
  onMoveToFolder,
  onDelete,
  children,
}: ProjectActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Move to folder submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput className="h-4 w-4 mr-2" />
            Move to Folder
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onMoveToFolder(project.id, null)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Root (no folder)
            </DropdownMenuItem>
            {folders.map(folder => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => onMoveToFolder(project.id, folder.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Delete */}
        <DropdownMenuItem
          onClick={() => onDelete(project)}
          className="text-destructive"
        >
          Delete Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
