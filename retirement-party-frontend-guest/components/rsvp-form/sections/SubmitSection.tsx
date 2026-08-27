import { Button } from "@/components/ui/button";
import type { Attending } from "@/types/rsvp";

interface SubmitSectionProps {
  attending: Attending | "";
}

export function SubmitSection({ attending }: SubmitSectionProps) {
  const label =
    attending === "Yes"
      ? "Confirm Attendance"
      : attending === "No"
        ? "Submit Response"
        : "Submit RSVP";

  return (
    <div className="border-[#e8e4dc] pt-6">
      <Button
        type="submit"
        size="lg"
        className="h-12 w-full bg-[#292929] text-white hover:bg-[#3b3b3b]"
      >
        {label}
      </Button>

      <p className="mt-3 text-center text-xs leading-5 text-[#888]">
        Your response is for the retirement celebration of R. Geeta Vani.
      </p>
    </div>
  );
}
