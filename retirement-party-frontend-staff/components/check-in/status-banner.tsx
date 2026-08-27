import { AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusBannerProps {
  error?: string;
  success?: string;
}

export function StatusBanner({ error, success }: StatusBannerProps) {
  if (error) {
    return (
      <div className="mt-4 flex min-h-[56px] items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-4 flex min-h-[56px] items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>{success}</span>
      </div>
    );
  }

  return null;
}
