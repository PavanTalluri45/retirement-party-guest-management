"use client";

import {
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createStaffApi } from "@/lib/api";

interface StaffMemberFormData {
  fullName: string;
  email: string;
  password: string;
}

const EMPTY_FORM: StaffMemberFormData = {
  fullName: "",
  email: "",
  password: "",
};

const passwordRequirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /\d/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
];

const validateStrongPassword = (value: string) =>
  passwordRequirements.every((req) => req.regex.test(value));

export function StaffMemberForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<StaffMemberFormData>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const passwordId = useId();

  const passwordChecks = useMemo(
    () =>
      passwordRequirements.map((req) => ({
        met: req.regex.test(formData.password),
        text: req.text,
      })),
    [formData.password],
  );

  const strengthScore = passwordChecks.filter((req) => req.met).length;

  const strengthColor =
    strengthScore === 0
      ? "bg-border"
      : strengthScore <= 1
        ? "bg-red-500"
        : strengthScore <= 2
          ? "bg-orange-500"
          : strengthScore === 3
            ? "bg-amber-500"
            : "bg-emerald-500";

  const strengthText =
    strengthScore === 0
      ? "Enter a password"
      : strengthScore <= 2
        ? "Weak password"
        : strengthScore <= 4
          ? "Medium password"
          : "Strong password";

  const handleChange =
    (field: keyof StaffMemberFormData) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = formData.fullName.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!name) {
      setErrorMessage("Please enter the staff member's full name.");
      return;
    }

    if (!email) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!validateStrongPassword(password)) {
      setErrorMessage(
        "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, number, and special character.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await createStaffApi({
        name,
        email,
        password,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Failed to create staff member.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        `Staff member "${name}" created successfully! Redirecting...`,
      );
      setFormData(EMPTY_FORM);

      // Redirect to staff list after short delay so admin sees confirmation
      setTimeout(() => {
        router.push("/staff/list");
      }, 1200);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create staff member. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/staff/list")}
          className="w-fit gap-1.5 -ml-2 mb-2 text-muted-foreground cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Staff List
        </Button>
        <CardTitle className="text-xl font-semibold text-foreground">
          Add Staff Member
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create a new staff account for attendee check-in and verification.
        </p>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={handleChange("fullName")}
              placeholder="Enter employee's full name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              placeholder="Enter employee's email address"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="Enter a secure password"
                disabled={isLoading}
                required
                className="pr-10"
                aria-describedby={
                  formData.password.length > 0
                    ? `${passwordId}-strength`
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {formData.password.length > 0 && (
              <div className="mt-3 space-y-2 origin-top opacity-0 animate-[fade-in_200ms_ease-out_forwards]">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={strengthScore}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-label="Password strength"
                >
                  <div
                    className={`h-full ${strengthColor} transition-all duration-500 ease-out`}
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                  />
                </div>

                <p
                  id={`${passwordId}-strength`}
                  className="text-sm font-medium text-foreground"
                >
                  {strengthText}. Must contain:
                </p>

                <ul className="space-y-1.5" aria-label="Password requirements">
                  {passwordChecks.map((req, index) => (
                    <li
                      key={req.text}
                      className="flex items-center gap-2 opacity-0 animate-[fade-in_180ms_ease-out_forwards]"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {req.met ? (
                        <Check
                          size={16}
                          className="text-emerald-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          size={16}
                          className="text-muted-foreground/80"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={
                          req.met
                            ? "text-xs text-emerald-600"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {req.text}
                        <span className="sr-only">
                          {req.met
                            ? " - Requirement met"
                            : " - Requirement not met"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="gap-1.5">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create Staff Member</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => router.push("/staff/list")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
