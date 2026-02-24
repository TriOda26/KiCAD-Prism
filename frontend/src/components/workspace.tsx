import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Project, FolderTreeItem } from "@/types/project";
import { ProjectCard } from "./project-card";
import { FolderTree } from "./folder-tree";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, Search, Settings, RefreshCw, FolderOpen, Folder, CircuitBoard, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImportDialog } from "./import-dialog";
import { SettingsDialog } from "./settings-dialog";
import { FolderDialog } from "./folder-dialog";
import { cn } from "@/lib/utils";
import Fuse from "fuse.js";
import { toast } from "sonner";



export function Workspace() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Load expanded state from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("expandedFolders");
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    }
    return new Set();
  });
  const [autoExpanded, setAutoExpanded] = useState(false);

  // Auto-expand folders when they change
  useEffect(() => {
    if (folders.length > 0 && !autoExpanded) {
      // Expand all folders that have projects
      const foldersWithProjects = new Set<string>();
      folders.forEach(folder => {
        if (folder.project_count > 0 || folder.children.length > 0) {
          foldersWithProjects.add(folder.id);
        }
      });
      setExpandedFolders(foldersWithProjects);
      setAutoExpanded(true);
    }
  }, [folders, autoExpanded]);

  // Helper function to get display name
  const getDisplayName = (project: Project) => {
    return project.display_name || project.name;
  };

  // Helper function to get projects in a folder
  const getFolderProjects = (folderId: string) => {
    return projects.filter(p => p.folder_id === folderId);
  };

  // Navigation state
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  // Import Dialog State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Folder Dialog States
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create" | "rename">("create");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [parentFolderName, setParentFolderName] = useState("");

  // Delete folder state
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);

  // Recent projects (last 3 opened) - stored in localStorage
  const [recentProjectIds, setRecentProjectIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentProjects");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, foldersRes] = await Promise.all([
        fetch("/api/projects/"),
        fetch("/api/projects/folders")
      ]);
      
      if (!projectsRes.ok) {
        throw new Error(`Failed to fetch projects: ${projectsRes.status}`);
      }
      
      const projectsData = await projectsRes.json();
      setProjects(projectsData);
      
      // Folders endpoint may not exist or fail - treat as empty list
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
      } else {
        console.warn('Failed to fetch folders, using empty list');
        setFolders([]);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fuse.js instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(projects, {
      keys: [
        { name: "name", weight: 2 },
        { name: "display_name", weight: 2 },
        { name: "description", weight: 1 },
        { name: "parent_repo", weight: 0.5 }
      ],
      threshold: 0.4, // Lower = stricter matching
      includeScore: true,
      ignoreLocation: true,
    });
  }, [projects]);

  // Global fuzzy search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      try {
        // Use Fuse.js for client-side fuzzy search
        const results = fuse.search(searchQuery);
        // Map to include the matched items with score
        const mappedResults = results.map(result => ({
          ...result.item,
          _score: result.score,
          thumbnail_url: `/api/projects/${result.item.id}/thumbnail`
        }));
        setSearchResults(mappedResults);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 150); // Faster since it's client-side

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fuse]);

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id);
    navigate(`/project/${project.id}`);
  };

  const handleGoHome = () => {
    setSelectedProjectId(undefined);
    setSearchQuery("");
  };

  // Folder management functions
  const handleCreateFolder = (parentFolderIdParam?: string | null, parentFolderNameParam?: string) => {
    setFolderDialogMode("create");
    setSelectedFolderId(null);
    setSelectedFolderName("");
    setParentFolderId(parentFolderIdParam ?? null);
    setParentFolderName(parentFolderNameParam ?? "");
    setIsFolderDialogOpen(true);
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    setFolderDialogMode("rename");
    setSelectedFolderId(folderId);
    setSelectedFolderName(currentName);
    setParentFolderId(null);
    setParentFolderName("");
    setIsFolderDialogOpen(true);
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    setFolderToDelete({ id: folderId, name: folderName });
  };

  const handleMoveProjectToFolder = async (projectId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/projects/projects/${projectId}/folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      });

      if (res.ok) {
        toast.success(`Project moved to ${folderId ? 'folder' : 'root'}`);
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Failed to move project: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (e: any) {
      toast.error(`Failed to move project: ${e.message || 'Network error'}`);
    }
  };

  const handleFolderSubmit = async (name: string) => {
    try {
      const url = folderDialogMode === "create"
        ? "/api/projects/folders"
        : `/api/projects/folders/${selectedFolderId}`;

      const method = folderDialogMode === "create" ? "POST" : "PUT";
      const body = folderDialogMode === "create"
        ? { name, parent_folder_id: parentFolderId }
        : { name };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(folderDialogMode === "create" ? "Folder created" : "Folder renamed");
        fetchData();
        setIsFolderDialogOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (e: any) {
      toast.error(`Failed: ${e.message || 'Network error'}`);
    }
  };

  // Toggle folder expanded state
  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      // Save to localStorage
      localStorage.setItem("expandedFolders", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const res = await fetch(`/api/projects/folders/${folderToDelete.id}?force=true`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success(`Folder "${folderToDelete.name}" deleted`);
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Failed to delete folder: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (e: any) {
      toast.error(`Failed to delete folder: ${e.message || 'Network error'}`);
    } finally {
      setFolderToDelete(null);
    }
  };

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteProject = async (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove from recent projects if present
        setRecentProjectIds((prev) => prev.filter((id) => id !== projectToDelete.id));

        // Show success toast
        toast.success(`Deleted "${getDisplayName(projectToDelete)}" successfully`);
        // Refresh the project list
        fetchData();
      } else {
        // Parse and show actual error from backend
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || 'Unknown error occurred';
        toast.error(`Failed to delete project: ${errorMessage}`);
      }
    } catch (e: any) {
      console.error('Delete error:', e);
      toast.error(`Failed to delete project: ${e.message || 'Network error'}`);
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  // Get recent projects data
  const recentProjects = recentProjectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter(Boolean) as Project[];

  // Get root projects (not in any folder)
  const rootProjects = useMemo(() => {
    return projects.filter(p => !p.folder_id);
  }, [projects]);

  // Get projects in folders
  const folderedProjects = useMemo(() => {
    return projects.filter(p => p.folder_id !== null && p.folder_id !== undefined);
  }, [projects]);

  // Filter projects based on search (for standalone projects view only)
  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const displayName = getDisplayName(project);
    return (
      displayName.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    );
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Folder Navigation */}
      <div className="w-72 border-r bg-card flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1
            className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
            onClick={handleGoHome}
          >
            KiCAD Prism
          </h1>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={fetchData} title="Refresh Projects">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Folder Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {/* New Folder Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start mb-2"
                onClick={() => handleCreateFolder()}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              
              {/* Folder Tree Component */}
              <FolderTree
                folders={folders}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveProjectToFolder={handleMoveProjectToFolder}
                expandedFolders={expandedFolders}
                onToggleFolder={toggleFolderExpanded}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
              />
              
              {/* Unsorted Projects in Sidebar */}
              {rootProjects.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Unsorted ({rootProjects.length})
                  </div>
                  {rootProjects.slice(0, 10).map(project => (
                    <div
                      key={project.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group",
                        selectedProjectId === project.id && "bg-accent"
                      )}
                      onClick={() => handleSelectProject(project)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('project-id', project.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      <CircuitBoard className="h-4 w-4 text-green-500" />
                      <span className="text-sm truncate flex-1">
                        {project.display_name || project.name}
                      </span>
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 cursor-grab" />
                    </div>
                  ))}
                  {rootProjects.length > 10 && (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      +{rootProjects.length - 10} more...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 
              className="text-2xl font-bold tracking-tight cursor-pointer hover:text-primary transition-colors"
              onClick={() => setSelectedFolderId(null)}
            >
              {selectedFolderId 
                ? folders.find(f => f.id === selectedFolderId)?.name || "Projects"
                : "All Projects"}
            </h2>
            {selectedFolderId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFolderId(null)}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsImportOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ImportDialog
            open={isImportOpen}
            onOpenChange={setIsImportOpen}
            onImportComplete={fetchData}
          />
          <SettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
          />
          <FolderDialog
            open={isFolderDialogOpen}
            onOpenChange={setIsFolderDialogOpen}
            mode={folderDialogMode}
            folderName={selectedFolderName}
            parentFolderName={parentFolderName}
            onSubmit={handleFolderSubmit}
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : searchQuery.trim() ? (
            // Search Results
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Search Results ({searchResults.length} found)
              </h3>
              {isSearching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[280px] rounded-xl" />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No projects found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResults.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      searchQuery={searchQuery}
                      onClick={() => {
                        setRecentProjectIds((prev) => {
                          const newRecent = [project.id, ...prev.filter((id) => id !== project.id)].slice(0, 3);
                          localStorage.setItem("recentProjects", JSON.stringify(newRecent));
                          return newRecent;
                        });
                        navigate(`/project/${project.id}`);
                      }}
                      showDelete
                      onDelete={() => handleDeleteProject(project)}
                      folders={folders}
                      onMoveToFolder={handleMoveProjectToFolder}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Projects View - Show projects from selected folder or all
            <div className="space-y-6">
              {recentProjects.length > 0 && !selectedFolderId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentProjects.slice(0, 3).map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        compact
                        onClick={() => handleSelectProject(project)}
                        showDelete
                        onDelete={() => handleDeleteProject(project)}
                        folders={folders}
                        onMoveToFolder={handleMoveProjectToFolder}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show projects from selected folder */}
              {selectedFolderId ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold">
                      {folders.find(f => f.id === selectedFolderId)?.name}
                    </h3>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {getFolderProjects(selectedFolderId).length}
                    </span>
                  </div>
                  {getFolderProjects(selectedFolderId).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {getFolderProjects(selectedFolderId).map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => handleSelectProject(project)}
                          showDelete
                          onDelete={() => handleDeleteProject(project)}
                          folders={folders}
                          onMoveToFolder={handleMoveProjectToFolder}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Folder className="h-12 w-12 mb-4 opacity-20" />
                      <p>No projects in this folder yet</p>
                      <p className="text-xs mt-1">Move projects here from the Unsorted section</p>
                    </div>
                  )}
                </div>
              ) : (
                /* All Projects (not in folder) */
                rootProjects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Folder className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Unsorted</h3>
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {rootProjects.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {rootProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => handleSelectProject(project)}
                          showDelete
                          onDelete={() => handleDeleteProject(project)}
                          folders={folders}
                          onMoveToFolder={handleMoveProjectToFolder}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Empty state */}
              {projects.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No projects found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{projectToDelete ? getDisplayName(projectToDelete) : ''}</strong>?
              This action cannot be undone. The project files will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation Dialog */}
      <Dialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete folder <strong>{folderToDelete?.name}</strong>?
              All projects and subfolders will be moved to root (no folder).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFolder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
