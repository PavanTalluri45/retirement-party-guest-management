import type { VerificationMethod } from "./types";

interface VerificationMethodOption {
  id: VerificationMethod;
  label: string;
  hint: string;
}

export const VERIFICATION_METHODS: VerificationMethodOption[] = [
  {
    id: "code",
    label: "Verification Code",
    hint: "4-digit confirmation code",
  },
  {
    id: "phone",
    label: "Phone Number",
    hint: "Search registered phone",
  },
];
