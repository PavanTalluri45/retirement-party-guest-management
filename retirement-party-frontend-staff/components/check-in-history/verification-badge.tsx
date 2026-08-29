import { getVerificationMeta } from "@/lib/check-in-history/format";

interface VerificationBadgeProps {
  method: string;
}

export function VerificationBadge({ method }: VerificationBadgeProps) {
  const meta = getVerificationMeta(method);
  return <span className={`text-xs font-medium ${meta.className}`}>{meta.label}</span>;
}
