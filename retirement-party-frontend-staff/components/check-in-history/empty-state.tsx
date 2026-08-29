import { History } from "lucide-react";

interface EmptyStateProps {
  searchActive: boolean;
  searchTerm: string;
}

export function EmptyState({ searchActive, searchTerm }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center">
      <div className="rounded-full bg-muted/60 p-3">
        <History className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          {searchActive ? "No matches found" : "No check-ins yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {searchActive
            ? `Nothing matches "${searchTerm}" — try a different name, phone, or code.`
            : "Guests you check in will show up here as soon as you verify them."}
        </p>
      </div>
    </div>
  );
}
