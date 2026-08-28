"use client";

import { motion } from "framer-motion";
import { InvitationPanel } from "./InvitationPanel";
import { PersonalDetailsSection } from "./sections/PersonalDetailsSection";
import { AttendanceSection } from "./sections/AttendanceSection";
import { DecliningNotice } from "./sections/DecliningNotice";
import { FamilyCountSection } from "./sections/FamilyCountSection";
import { MealPreferenceSection } from "./sections/MealPreferenceSection";
import { SubmitSection } from "./sections/SubmitSection";
import { useRsvpForm } from "./hooks/useRsvpForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RSVPForm() {
  const {
    register,
    control,
    watch,
    formState: { errors },
    attending,
    familyCount,
    isSubmitting,
    submitError,
    onSubmit,
  } = useRsvpForm();

  return (
    <main className="h-screen overflow-hidden bg-[#f8f7f4]">
      <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
        <InvitationPanel />

        <motion.section
          initial={{ x: 70, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="h-[58vh] overflow-y-auto overscroll-contain bg-white lg:h-screen"
        >
          <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
            <form onSubmit={onSubmit} className="space-y-8">
              {submitError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                  <AlertDescription className="text-red-700 font-medium">
                    {submitError}
                  </AlertDescription>
                </Alert>
              )}

              <PersonalDetailsSection register={register} errors={errors} />

              <AttendanceSection control={control} errors={errors} />

              {attending === "No" && <DecliningNotice />}

              {attending === "Yes" && (
                <>
                  <FamilyCountSection control={control} />
                  <MealPreferenceSection
                    control={control}
                    register={register}
                    errors={errors}
                    watch={watch}
                    familyCount={familyCount}
                  />
                </>
              )}

              <SubmitSection attending={attending} isSubmitting={isSubmitting} />
            </form>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
