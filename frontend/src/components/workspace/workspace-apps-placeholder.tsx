import { AppWindow } from "lucide-react";

export function WorkspaceAppsPlaceholder() {
  return (
    <div className="p-6">
      <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/10 text-center">
        <AppWindow className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Apps &amp; Integrations</p>
        <p className="text-sm text-muted-foreground">
          This section is intentionally blank for upcoming integrations.
        </p>
      </div>
    </div>
  );
}
