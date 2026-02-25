import { type KeyboardEvent } from "react";

import { isDialogSubmitShortcut } from "@/lib/dialog-shortcuts";
import { FolderTreeItem } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteFolderDialogProps {
  folder: FolderTreeItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (folderId: string) => void | Promise<void>;
}

export function DeleteFolderDialog({ folder, isDeleting, onClose, onConfirm }: DeleteFolderDialogProps) {
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isDialogSubmitShortcut(event)) {
      return;
    }

    event.preventDefault();
    if (isDeleting || !folder) {
      return;
    }

    void onConfirm(folder.id);
  };

  return (
    <Dialog open={!!folder} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
          <DialogDescription>
            Delete <strong>{folder?.name || ""}</strong> and nested folders. Projects in those folders will be moved to workspace root.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => folder && void onConfirm(folder.id)}
            disabled={isDeleting || !folder}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
