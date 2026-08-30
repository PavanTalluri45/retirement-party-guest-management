"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { registerAdminApi } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { setAppUser, clearAuth } from "@/store/slices/authSlice";

const passwordRequirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /\d/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
];

const validatePasswordStrength = (value: string) =>
  passwordRequirements.every((req) => req.regex.test(value));

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const { signUp, logOut } = useAuth();
  const dispatch = useAppDispatch();
  const passwordId = React.useId();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const passwordChecks = React.useMemo(
    () =>
      passwordRequirements.map((req) => ({
        met: req.regex.test(password),
        text: req.text,
      })),
    [password],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation checks
    if (!name.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!validatePasswordStrength(password)) {
      setErrorMessage(
        "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, number, and special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create Firebase Authentication account
      await signUp(email.trim(), password);

      // 2. Register MongoDB application profile (ADMIN role)
      const res = await registerAdminApi(name.trim());

      if (!res.success || !res.data?.user) {
        await logOut().catch(() => {});
        dispatch(clearAuth());
        setErrorMessage(
          res.message ||
            "Failed to create application profile. Please try again.",
        );
        setIsLoading(false);
        return;
      }

      // 3. Store in Redux and redirect to Admin Dashboard
      dispatch(setAppUser(res.data.user));
      router.push("/Dashboard");
    } catch (err: unknown) {
      await logOut().catch(() => {});
      dispatch(clearAuth());

      let message = "Failed to create account. Please try again.";
      if (typeof err === "object" && err !== null) {
        const errObj = err as Record<string, unknown>;
        const code = typeof errObj.code === "string" ? errObj.code : "";
        switch (code) {
          case "auth/email-already-in-use":
            message = "An account with this email already exists.";
            break;
          case "auth/invalid-email":
            message = "The provided email address is invalid.";
            break;
          case "auth/weak-password":
            message =
              "Password is too weak. Please choose a stronger password.";
            break;
          default:
            if (typeof errObj.message === "string") {
              message = errObj.message;
            }
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create Admin Account</CardTitle>
        <CardDescription>
          Enter your information below to create an admin account and manage the
          panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id={passwordId}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
                  aria-describedby={
                    password.length > 0 ? `${passwordId}-strength` : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              {password.length > 0 && (
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

                  <ul
                    className="space-y-1.5"
                    aria-label="Password requirements"
                  >
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
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirm-password"
                  placeholder="Re-enter your password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showConfirmPassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>
            <FieldGroup className="gap-4">
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
