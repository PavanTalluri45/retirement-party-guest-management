import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function HistoryToolbar() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            My check-in history
          </h2>
          <p className="text-xs text-muted-foreground">
            Guests you&apos;ve personally checked in for this event
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/staff/check-in")}
        className="cursor-pointer gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground sm:self-auto"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to check-in</span>
      </Button>
    </div>
  );
}
