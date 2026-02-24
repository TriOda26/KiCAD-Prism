import { useState } from "react";
import { FolderOpen, Folder, ChevronRight, ChevronDown, Plus, Pencil, Trash2, FileUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FolderTreeItem, Project } from "@/types/project";

interface FolderTreeProps {
  folders: FolderTreeItem[];
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (project: Project) => void;
  onCreateFolder: (parentFolderId?: string | null, parentFolderName?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string, folderName: string) => void;
  onMoveProjectToFolder: (projectId: string, folderId: string | null) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
}

export function FolderTree({
  folders,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveProjectToFolder,
  expandedFolders,
  onToggleFolder,
  selectedFolderId,
  onSelectFolder,
}: FolderTreeProps) {
  // Get root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_folder_id || f.parent_folder_id === null || f.parent_folder_id === '');
  
  console.log('[FolderTree] rootFolders:', rootFolders.map(f => ({ name: f.name, id: f.id, parent: f.parent_folder_id })));

  return (
    <div className="space-y-1">
      {rootFolders.length === 0 ? (
        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
          No folders yet. Click "New Folder" to create one.
        </div>
      ) : (
        rootFolders.map(folder => (
          <FolderNode
            key={folder.id}
            folder={folder}
            allFolders={folders}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={onSelectProject}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveProjectToFolder={onMoveProjectToFolder}
            expandedFolders={expandedFolders}
            onToggleFolder={onToggleFolder}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            depth={0}
          />
        ))
      )}
    </div>
  );
}

// Recursive folder node component
function FolderNode({
  folder,
  allFolders,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveProjectToFolder,
  expandedFolders,
  onToggleFolder,
  selectedFolderId,
  onSelectFolder,
  depth,
}: {
  folder: FolderTreeItem;
  allFolders: FolderTreeItem[];
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (project: Project) => void;
  onCreateFolder: (parentFolderId?: string | null, parentFolderName?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string, folderName: string) => void;
  onMoveProjectToFolder: (projectId: string, folderId: string | null) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
  depth: number;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  
  // Get direct children folders
  const childFolders = allFolders.filter(
    f => f.parent_folder_id === folder.id
  );
  
  // Get projects in this folder
  const folderProjects = projects.filter(p => p.folder_id === folder.id);
  
  const hasChildren = childFolders.length > 0 || folderProjects.length > 0;

  // Drag handlers for folder
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('project-id')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const projectId = e.dataTransfer.getData('project-id');
    if (projectId) {
      onMoveProjectToFolder(projectId, folder.id);
    }
  };

  return (
    <div>
      {/* Folder Row */}
      <div
        className={cn(
          "group flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent/50",
          isDragOver && "bg-primary/20 border-2 border-primary border-dashed"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFolder(folder.id);
          }}
          className={cn(
            "w-5 h-5 flex items-center justify-center rounded transition-colors shrink-0",
            hasChildren ? "opacity-100 hover:bg-accent" : "opacity-0 pointer-events-none"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
          )}
        </button>

        {/* Folder Icon */}
        <button
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => onSelectFolder?.(folder.id)}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
          )}
          
          <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
          
          {/* Count Badge */}
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
            {folderProjects.length + folder.project_count}
          </span>
        </button>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
            <DropdownMenuItem onClick={() => onCreateFolder(folder.id, folder.name)}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              New Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameFolder(folder.id, folder.name)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeleteFolder(folder.id, folder.name)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div>
          {/* Child Folders */}
          {childFolders.map(childFolder => (
            <FolderNode
              key={childFolder.id}
              folder={childFolder}
              allFolders={allFolders}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveProjectToFolder={onMoveProjectToFolder}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              depth={depth + 1}
            />
          ))}
          
          {/* Projects in this folder */}
          {folderProjects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              selected={selectedProjectId === project.id}
              onSelect={() => onSelectProject(project)}
              folders={allFolders}
              onMoveToFolder={onMoveProjectToFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Draggable project item
function ProjectItem({
  project,
  selected,
  onSelect,
  folders,
  onMoveToFolder,
  depth,
}: {
  project: Project;
  selected: boolean;
  onSelect: () => void;
  folders: FolderTreeItem[];
  onMoveToFolder: (projectId: string, folderId: string | null) => void;
  depth: number;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('project-id', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors group",
        selected ? "bg-accent" : "hover:bg-accent/50"
      )}
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
      onClick={onSelect}
      draggable
      onDragStart={handleDragStart}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 cursor-grab" />
      <FileUp className="h-4 w-4 text-green-500 shrink-0" />
      <span className="text-sm truncate flex-1">
        {project.display_name || project.name}
      </span>
      
      {/* Quick move dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem onClick={() => onMoveToFolder(project.id, null)}>
            Move to Root
          </DropdownMenuItem>
          {folders.map(f => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => onMoveToFolder(project.id, f.id)}
            >
              <Folder className="h-3 w-3 mr-2" />
              {f.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
