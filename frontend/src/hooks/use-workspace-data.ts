import { useCallback, useEffect, useMemo, useState } from "react";

import { FolderTreeItem, Project } from "@/types/project";

export interface WorkspaceActionResult {
  ok: boolean;
  error?: string;
}

interface WorkspaceDataState {
  projects: Project[];
  folders: FolderTreeItem[];
  loading: boolean;
  error: string | null;
  folderById: Map<string, FolderTreeItem>;
  refresh: () => Promise<void>;
  createFolder: (name: string, parentId: string | null) => Promise<WorkspaceActionResult>;
  renameFolder: (folderId: string, name: string) => Promise<WorkspaceActionResult>;
  deleteFolder: (folderId: string) => Promise<WorkspaceActionResult>;
  moveProject: (projectId: string, folderId: string | null) => Promise<WorkspaceActionResult>;
  deleteProject: (projectId: string) => Promise<WorkspaceActionResult>;
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string };
    return payload.detail || payload.message || fallback;
  } catch {
    return fallback;
  }
}

export function useWorkspaceData(): WorkspaceDataState {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [projectsResponse, foldersResponse] = await Promise.all([
        fetch("/api/projects/"),
        fetch("/api/folders/tree"),
      ]);

      if (!projectsResponse.ok) {
        throw new Error(await getErrorMessage(projectsResponse, "Failed to load projects"));
      }

      const projectPayload = (await projectsResponse.json()) as Project[];
      setProjects(projectPayload);

      if (foldersResponse.ok) {
        const folderPayload = (await foldersResponse.json()) as FolderTreeItem[];
        setFolders(folderPayload);
      } else {
        setFolders([]);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "An error occurred while loading workspace";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const folderById = useMemo(() => {
    const lookup = new Map<string, FolderTreeItem>();
    folders.forEach((folder) => {
      lookup.set(folder.id, folder);
    });
    return lookup;
  }, [folders]);

  const createFolder = useCallback(
    async (name: string, parentId: string | null): Promise<WorkspaceActionResult> => {
      try {
        const response = await fetch("/api/folders/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            parent_id: parentId,
          }),
        });

        if (!response.ok) {
          return { ok: false, error: await getErrorMessage(response, "Failed to create folder") };
        }

        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "Failed to create folder" };
      }
    },
    [refresh]
  );

  const renameFolder = useCallback(
    async (folderId: string, name: string): Promise<WorkspaceActionResult> => {
      try {
        const response = await fetch(`/api/folders/${folderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          return { ok: false, error: await getErrorMessage(response, "Failed to rename folder") };
        }

        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "Failed to rename folder" };
      }
    },
    [refresh]
  );

  const deleteFolder = useCallback(
    async (folderId: string): Promise<WorkspaceActionResult> => {
      try {
        const response = await fetch(`/api/folders/${folderId}?cascade=true`, {
          method: "DELETE",
        });

        if (!response.ok) {
          return { ok: false, error: await getErrorMessage(response, "Failed to delete folder") };
        }

        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "Failed to delete folder" };
      }
    },
    [refresh]
  );

  const moveProject = useCallback(
    async (projectId: string, folderId: string | null): Promise<WorkspaceActionResult> => {
      try {
        const response = await fetch(`/api/folders/projects/${projectId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_id: folderId }),
        });

        if (!response.ok) {
          return { ok: false, error: await getErrorMessage(response, "Failed to move project") };
        }

        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "Failed to move project" };
      }
    },
    [refresh]
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<WorkspaceActionResult> => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          return { ok: false, error: await getErrorMessage(response, "Failed to delete project") };
        }

        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "Failed to delete project" };
      }
    },
    [refresh]
  );

  return {
    projects,
    folders,
    loading,
    error,
    folderById,
    refresh,
    createFolder,
    renameFolder,
    deleteFolder,
    moveProject,
    deleteProject,
  };
}
