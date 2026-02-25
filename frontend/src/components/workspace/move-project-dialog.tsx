import { useEffect, useState, type KeyboardEvent } from "react";

import { isDialogSubmitShortcut } from "@/lib/dialog-shortcuts";
import { FolderTreeItem, Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MoveProjectDialogProps {
  project: Project | null;
  folders: FolderTreeItem[];
  isMoving: boolean;
  onClose: () => void;
  onConfirm: (projectId: string, folderId: string | null) => void | Promise<void>;
  getProjectDisplayName: (project: Project) => string;
}

const ROOT_VALUE = "__root__";

export function MoveProjectDialog({
  project,
  folders,
  isMoving,
  onClose,
  onConfirm,
  getProjectDisplayName,
}: MoveProjectDialogProps) {
  const [targetFolderId, setTargetFolderId] = useState(ROOT_VALUE);

  useEffect(() => {
    setTargetFolderId(project?.folder_id ?? ROOT_VALUE);
  }, [project]);

  const submit = () => {
    if (!project) {
      return;
    }
    void onConfirm(project.id, targetFolderId === ROOT_VALUE ? null : targetFolderId);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isDialogSubmitShortcut(event)) {
      return;
    }

    event.preventDefault();
    if (isMoving || !project) {
      return;
    }

    submit();
  };

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>Move Project</DialogTitle>
          <DialogDescription>Select where this project should live.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Project: {project ? getProjectDisplayName(project) : ""}
          </p>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={targetFolderId}
            onChange={(event) => setTargetFolderId(event.target.value)}
          >
            <option value={ROOT_VALUE}>Workspace Root</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {`${"  ".repeat(folder.depth)}${folder.name}`}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isMoving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isMoving || !project}>
            {isMoving ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
