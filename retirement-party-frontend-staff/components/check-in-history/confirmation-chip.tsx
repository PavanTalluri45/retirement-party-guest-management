interface ConfirmationChipProps {
  code?: string | null;
  className?: string;
}

export function ConfirmationChip({ code, className }: ConfirmationChipProps) {
  return <span className={className ?? "text-foreground"}>{code || "—"}</span>;
}
