import type { KeyboardEvent } from "react";

export function isDialogSubmitShortcut(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key === "Enter" && (event.metaKey || event.ctrlKey);
}
