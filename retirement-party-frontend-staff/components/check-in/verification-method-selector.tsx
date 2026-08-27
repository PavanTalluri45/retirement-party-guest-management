"use client";

import { cn } from "@/lib/utils";
import type { VerificationMethod } from "@/lib/check-in/types";
import { VERIFICATION_METHODS } from "@/lib/check-in/verification-methods";

interface VerificationMethodSelectorProps {
  selected: VerificationMethod;
  onSelect: (method: VerificationMethod) => void;
}

export function VerificationMethodSelector({
  selected,
  onSelect,
}: VerificationMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {VERIFICATION_METHODS.map(({ id, label, hint }) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-pressed={isSelected}
            className={cn(
              "relative flex flex-col justify-center rounded-lg border px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
              isSelected
                ? "border-primary bg-primary/[0.04] shadow-xs ring-1 ring-primary/20 dark:bg-primary/10"
                : "border-border bg-card hover:border-border hover:bg-muted/30",
            )}
          >
            <div
              className={cn(
                "text-sm font-semibold tracking-tight",
                isSelected ? "text-foreground" : "text-foreground/90",
              )}
            >
              {label}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
          </button>
        );
      })}
    </div>
  );
}
