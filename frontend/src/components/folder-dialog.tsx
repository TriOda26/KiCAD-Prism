import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename";
  folderName?: string;
  parentFolderName?: string;
  onSubmit: (name: string) => void;
  isLoading?: boolean;
}

export function FolderDialog({
  open,
  onOpenChange,
  mode,
  folderName = "",
  parentFolderName,
  onSubmit,
  isLoading = false,
}: FolderDialogProps) {
  const [name, setName] = useState(folderName);

  useEffect(() => {
    setName(folderName);
  }, [folderName, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create New Folder" : "Rename Folder"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? parentFolderName
                  ? `Create a new subfolder in "${parentFolderName}"`
                  : "Create a new folder to organize your projects."
                : `Rename "${folderName}" to something else.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-2"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {mode === "create" ? "Create" : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
