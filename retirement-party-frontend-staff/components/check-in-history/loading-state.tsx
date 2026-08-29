import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-sm font-medium">Pulling up your check-ins…</span>
    </div>
  );
}
