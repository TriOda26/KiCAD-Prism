import { FolderOpen, Folder, ChevronRight, ChevronDown, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";
import type { FolderTreeItem, Project } from "@/types/project";

interface FolderSectionProps {
  folder: FolderTreeItem;
  allFolders: FolderTreeItem[];
  projects: Project[];
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  searchQuery: string;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  folders: FolderTreeItem[];
  onMoveToFolder: (projectId: string, folderId: string | null) => void;
  depth?: number;
}

export function FolderSection({
  folder,
  allFolders,
  projects,
  expandedFolders,
  onToggleFolder,
  searchQuery,
  onSelectProject,
  onDeleteProject,
  folders,
  onMoveToFolder,
  depth = 0,
}: FolderSectionProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const folderProjects = projects.filter(p => p.folder_id === folder.id);
  const subfolders = allFolders.filter(f => f.parent_folder_id === folder.id);
  const hasChildren = subfolders.length > 0 || folderProjects.length > 0;

  return (
    <div className="mb-6">
      {/* Folder Header */}
      <div
        className={cn(
          "group flex items-center gap-3 mb-4 cursor-pointer p-3 rounded-lg transition-all duration-200",
          "hover:bg-accent/70 border border-transparent hover:border-accent",
          isExpanded && "bg-accent/30 border-accent/50",
          depth > 0 && "ml-2"
        )}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={() => onToggleFolder(folder.id)}
      >
        {/* Expand/Collapse Chevron - Large and visible */}
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shrink-0",
          "bg-primary/10 hover:bg-primary/20 hover:shadow-md",
          hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {isExpanded ? (
            <ChevronDown className="h-6 w-6 text-primary font-bold" strokeWidth={3} />
          ) : (
            <ChevronRight className="h-6 w-6 text-primary font-bold" strokeWidth={3} />
          )}
        </div>
        
        {/* Folder Icon - Larger and more visible */}
        <div className={cn(
          "flex items-center justify-center w-9 h-9 rounded-xl transition-colors shrink-0",
          isExpanded ? "bg-yellow-500/25" : "bg-yellow-500/15"
        )}>
          {isExpanded ? (
            <FolderOpen className="h-6 w-6 text-yellow-600" strokeWidth={2.5} />
          ) : (
            <Folder className="h-6 w-6 text-yellow-600" strokeWidth={2.5} />
          )}
        </div>
        
        {/* Folder Name */}
        <h3 className="text-base font-semibold tracking-tight">{folder.name}</h3>
        
        {/* Project Count Badge - More visible */}
        <span className={cn(
          "flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-full text-xs font-semibold transition-colors",
          isExpanded 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "bg-muted text-muted-foreground group-hover:bg-background"
        )}>
          {folderProjects.length + folder.children.reduce((acc, child) => acc + child.project_count, 0)}
        </span>
      </div>

      {/* Folder Content */}
      {isExpanded && (
        <div className={cn(
          "relative",
          depth > 0 && "border-l-2 border-muted/30 ml-6 pl-4"
        )}>
          {/* Subfolders */}
          {subfolders.map(subfolder => (
            <FolderSection
              key={subfolder.id}
              folder={subfolder}
              allFolders={allFolders}
              projects={projects}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              searchQuery={searchQuery}
              onSelectProject={onSelectProject}
              onDeleteProject={onDeleteProject}
              folders={folders}
              onMoveToFolder={onMoveToFolder}
              depth={depth + 1}
            />
          ))}

          {/* Projects in this folder */}
          {folderProjects.length > 0 && (
            <div className={cn(
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
              subfolders.length > 0 && "mt-6"
            )}>
              {folderProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  searchQuery={searchQuery}
                  onClick={() => onSelectProject(project)}
                  showDelete
                  onDelete={() => onDeleteProject(project)}
                  folders={folders}
                  onMoveToFolder={onMoveToFolder}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
