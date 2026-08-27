"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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

export function StaffMemberForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<StaffMemberFormData>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
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

      setSuccessMessage(`Staff member "${name}" created successfully! Redirecting...`);
      setFormData(EMPTY_FORM);

      // Redirect to staff list after short delay so admin sees confirmation
      setTimeout(() => {
        router.push("/staff/list");
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create staff member. Please try again.";
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
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="Enter a secure password (min 8 chars)"
                disabled={isLoading}
                required
                className="pr-10"
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
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="gap-1.5">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Staff Member
                </>
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
