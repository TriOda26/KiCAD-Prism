import { useEffect, useState, type KeyboardEvent } from "react";

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
import { Input } from "@/components/ui/input";

interface RenameFolderDialogProps {
  folder: FolderTreeItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (folderId: string, name: string) => void | Promise<void>;
}

export function RenameFolderDialog({ folder, isSubmitting, onClose, onSubmit }: RenameFolderDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(folder?.name ?? "");
  }, [folder]);

  const submit = () => {
    if (!folder) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    void onSubmit(folder.id, trimmed);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isDialogSubmitShortcut(event)) {
      return;
    }

    event.preventDefault();
    if (!folder || isSubmitting || !name.trim()) {
      return;
    }

    submit();
  };

  return (
    <Dialog open={!!folder} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>Update folder name.</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Folder name"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
