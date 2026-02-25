import { useMemo } from "react";
import Fuse from "fuse.js";

import { FolderTreeItem, Project } from "@/types/project";

export type SearchProject = Project & {
  folder_path: string;
};

interface WorkspaceSearchResult {
  isSearching: boolean;
  searchResults: SearchProject[];
}

export function useWorkspaceSearch(
  projects: Project[],
  folderById: Map<string, FolderTreeItem>,
  searchQuery: string
): WorkspaceSearchResult {
  const searchProjects = useMemo<SearchProject[]>(() => {
    const getFolderPath = (folderId?: string | null) => {
      if (!folderId) {
        return "Workspace Root";
      }

      const names: string[] = [];
      let activeId: string | null = folderId;
      let guard = 0;

      while (activeId && guard < 64) {
        const folder = folderById.get(activeId);
        if (!folder) {
          break;
        }
        names.unshift(folder.name);
        activeId = folder.parent_id ?? null;
        guard += 1;
      }

      return names.length > 0 ? names.join(" / ") : "Workspace Root";
    };

    return projects.map((project) => ({
      ...project,
      folder_path: getFolderPath(project.folder_id),
    }));
  }, [projects, folderById]);

  const searchEngine = useMemo(() => {
    return new Fuse(searchProjects, {
      keys: [
        { name: "name", weight: 2 },
        { name: "display_name", weight: 2 },
        { name: "description", weight: 1.5 },
        { name: "parent_repo", weight: 1 },
        { name: "sub_path", weight: 1 },
        { name: "folder_path", weight: 0.75 },
        { name: "last_modified", weight: 0.5 },
      ],
      threshold: 0.35,
      includeScore: true,
      ignoreLocation: true,
    });
  }, [searchProjects]);

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) {
      return [] as SearchProject[];
    }
    return searchEngine.search(searchQuery.trim()).map((result) => result.item);
  }, [isSearching, searchEngine, searchQuery]);

  return {
    isSearching,
    searchResults,
  };
}
