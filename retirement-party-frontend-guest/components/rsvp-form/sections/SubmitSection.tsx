import { Button } from "@/components/ui/button";
import type { Attending } from "@/types/rsvp";

interface SubmitSectionProps {
  attending: Attending | "";
  isSubmitting?: boolean;
}

export function SubmitSection({ attending, isSubmitting = false }: SubmitSectionProps) {
  const label = isSubmitting
    ? "Submitting..."
    : attending === "Yes"
    ? "Confirm Attendance"
    : attending === "No"
    ? "Submit Response"
    : "Submit RSVP";

  return (
    <div className="border-[#e8e4dc] pt-6">
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-12 w-full bg-[#292929] text-white hover:bg-[#3b3b3b] disabled:opacity-70"
      >
        {isSubmitting && (
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {label}
      </Button>

      <p className="mt-3 text-center text-xs leading-5 text-[#888]">
        Your response is for the retirement celebration of R. Geeta Vani.
      </p>
    </div>
  );
}
