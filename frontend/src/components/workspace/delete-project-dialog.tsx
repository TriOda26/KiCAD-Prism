import { type KeyboardEvent } from "react";

import { isDialogSubmitShortcut } from "@/lib/dialog-shortcuts";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteProjectDialogProps {
  project: Project | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (projectId: string) => void | Promise<void>;
  getProjectDisplayName: (project: Project) => string;
}

export function DeleteProjectDialog({
  project,
  isDeleting,
  onClose,
  onConfirm,
  getProjectDisplayName,
}: DeleteProjectDialogProps) {
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isDialogSubmitShortcut(event)) {
      return;
    }

    event.preventDefault();
    if (isDeleting || !project) {
      return;
    }

    void onConfirm(project.id);
  };

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{project ? getProjectDisplayName(project) : ""}</strong>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => project && void onConfirm(project.id)}
            disabled={isDeleting || !project}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
