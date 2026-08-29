import { Alert, AlertDescription } from "@/components/ui/alert";

interface StatusBannerProps {
  error?: string;
  success?: string;
}

export function StatusBanner({ error, success }: StatusBannerProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="mt-4 min-h-[56px] items-center">
        <AlertDescription className="font-medium">{error}</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="mt-4 min-h-[56px] items-center border-emerald-500/40 bg-emerald-500/5">
        <AlertDescription className="font-medium text-emerald-700 dark:text-emerald-400">
          {success}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
