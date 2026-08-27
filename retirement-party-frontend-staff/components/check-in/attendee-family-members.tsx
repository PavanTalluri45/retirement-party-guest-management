interface AttendeeFamilyMembersProps {
  members: string[];
}

export function AttendeeFamilyMembers({ members }: AttendeeFamilyMembersProps) {
  if (members.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 p-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
        Accompanied Family Members
      </div>
      <div className="flex flex-wrap gap-1.5">
        {members.map((member, index) => (
          <span
            key={index}
            className="inline-flex items-center rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
          >
            {member}
          </span>
        ))}
      </div>
    </div>
  );
}
