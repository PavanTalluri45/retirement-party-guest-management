import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function DecliningNotice() {
  return (
    <Alert>
      <AlertTitle>Thank you for letting us know</AlertTitle>
      <AlertDescription>
        No additional details are required. Submit your response below.
      </AlertDescription>
    </Alert>
  );
}