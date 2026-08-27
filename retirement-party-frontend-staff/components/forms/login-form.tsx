"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMe } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { setAppUser, clearAuth } from "@/store/slices/authSlice";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { logIn, logOut } = useAuth();
  const dispatch = useAppDispatch();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Firebase sign in
      await logIn(email.trim(), password);

      // 2. Fetch application profile from Auth Service
      const res = await fetchMe();

      if (!res.success || !res.data?.user) {
        await logOut();
        setErrorMessage(
          res.message || "Account profile not found. Please contact an administrator."
        );
        setIsLoading(false);
        return;
      }

      const user = res.data.user;

      // 3. Verify STAFF role
      if (user.role !== "STAFF") {
        await logOut();
        setErrorMessage(
          "Access denied: You do not have permission to access the Staff portal."
        );
        setIsLoading(false);
        return;
      }

      // 4. Verify Active status
      if (!user.isActive) {
        await logOut();
        setErrorMessage(
          "Your account has been deactivated. Please contact an administrator."
        );
        setIsLoading(false);
        return;
      }

      // 5. Store in Redux and redirect to check-in
      dispatch(setAppUser(user));
      router.push("/staff/check-in");
    } catch (err: unknown) {
      await logOut().catch(() => {});
      dispatch(clearAuth());

      let message = "Failed to sign in. Please check your credentials.";
      if (typeof err === "object" && err !== null) {
        const errObj = err as Record<string, unknown>;
        const code = typeof errObj.code === "string" ? errObj.code : "";
        switch (code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            message = "Invalid email or password.";
            break;
          case "auth/user-disabled":
            message = "This account has been disabled.";
            break;
          case "auth/too-many-requests":
            message =
              "Too many failed login attempts. Please try again later.";
            break;
          case "auth/invalid-email":
            message = "The provided email address is invalid.";
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Staff Login</CardTitle>
          <CardDescription>
            Sign in to verify guest check-ins for the event.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Alert>
            <ShieldCheck />
            <AlertTitle>Staff access only</AlertTitle>
            <AlertDescription>
              Use the email and password sent to you by the event admin.
            </AlertDescription>
          </Alert>

          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
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
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}