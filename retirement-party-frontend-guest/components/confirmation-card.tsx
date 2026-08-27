"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { RSVPData } from "@/types/rsvp";

interface ConfirmationCardProps {
  rsvpData: RSVPData;
}

const VENUE_ADDRESS =
  "Padmavathi Function Hall, Ponduranga Pet, Tenali - 522201";

// Basic "no API key" Google Maps embed. Good enough for a lightweight,
// low-traffic invitation page. If this ever gets heavy traffic or the
// embed stops rendering reliably, switch to the official Maps Embed API
// with a key: https://developers.google.com/maps/documentation/embed/get-started
const VENUE_MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  VENUE_ADDRESS
)}&output=embed`;

const VENUE_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  VENUE_ADDRESS
)}`;

export function ConfirmationCard({
  rsvpData,
}: ConfirmationCardProps) {
  const router = useRouter();

  const isAttending = rsvpData.attending === "Yes";

  return (
    <main className="h-screen overflow-hidden bg-[#f8f7f4]">
      <div className="grid h-screen grid-cols-1 lg:grid-cols-2">

        {/* ========================================================
            LEFT SIDE
            FIXED INVITATION
            ======================================================== */}

        <section className="relative h-[42vh] overflow-hidden bg-[#f3f1ec] lg:h-screen">
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10">
            <div className="relative h-full w-full">
              <Image
                src="/invitation.jpeg"
                alt="Retirement party invitation for R. Geeta Vani"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* ========================================================
            RIGHT SIDE
            SCROLLABLE CONFIRMATION
            ======================================================== */}

        <section className="h-[58vh] overflow-y-auto overscroll-contain bg-white lg:h-screen">
          <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">

            {/* ====================================================
                SUCCESS HEADER
                ==================================================== */}

            <div className="mb-10">
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#9a7b32]">
                {isAttending
                  ? "Response Received"
                  : "Thank You"}
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-[#252525] sm:text-4xl">
                {isAttending
                  ? "We look forward to seeing you!"
                  : "Thank you for letting us know."}
              </h1>

              <p className="mt-3 max-w-xl text-base leading-7 text-[#6b6b6b]">
                {isAttending
                  ? "Your attendance has been confirmed for the retirement celebration of R. Geeta Vani."
                  : "We appreciate you taking the time to respond. We will miss having you at the celebration."}
              </p>
            </div>

            {/* ====================================================
                EVENT INFORMATION
                ==================================================== */}

            <section className="mb-10">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-[#292929]">
                  Event Details
                </h2>

                <p className="mt-1 text-sm text-[#777]">
                  A special celebration for R. Geeta Vani.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#888]">
                    Occasion
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#333]">
                    Retirement Celebration
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#888]">
                    Venue
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#333]">
                    Padmavathi Function Hall
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#777]">
                    Ponduranga Pet, Tenali - 522201
                  </p>
                </div>
              </div>

              {/* Location map */}
              <div className="mt-5">
                <iframe
                  title="Venue location map"
                  src={VENUE_MAP_EMBED_URL}
                  className="h-56 w-full rounded-lg sm:h-64"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <a
                  href={VENUE_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-[#9a7b32] underline underline-offset-4"
                >
                  Get Directions
                </a>
              </div>
            </section>

            {/* ====================================================
                RESPONSE SUMMARY
                ==================================================== */}

            <section className="mb-10">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-[#292929]">
                  Your Response
                </h2>

                <p className="mt-1 text-sm text-[#777]">
                  Details submitted with your RSVP.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#888]">Name</p>
                  <p className="mt-1 text-sm font-medium text-[#333]">
                    {rsvpData.fullName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#888]">Phone</p>
                  <p className="mt-1 text-sm font-medium text-[#333]">
                    {rsvpData.phoneNumber}
                  </p>
                </div>

                <div className="flex items-start justify-between gap-4 border-t border-[#eeeae2] pt-4">
                  <div>
                    <p className="text-xs text-[#888]">
                      Attendance
                    </p>

                    <p
                      className={`
                        mt-1 text-sm font-semibold
                        ${
                          isAttending
                            ? "text-[#2f8a4b]"
                            : "text-[#666]"
                        }
                      `}
                    >
                      {isAttending
                        ? "Attending"
                        : "Not Attending"}
                    </p>
                  </div>

                  <p
                    className={`
                      text-xs font-medium
                      ${
                        isAttending
                          ? "text-[#2f8a4b]"
                          : "text-[#666]"
                      }
                    `}
                  >
                    {isAttending
                      ? "Confirmed"
                      : "Response Received"}
                  </p>
                </div>
              </div>
            </section>

            {/* ====================================================
                ATTENDEE MEALS
                ONLY FOR ATTENDING GUESTS
                ==================================================== */}

            {isAttending && (
              <section className="mb-10">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-[#292929]">
                    Guest & Meal Details
                  </h2>

                  <p className="mt-1 text-sm text-[#777]">
                    Individual meal preferences for your
                    group.
                  </p>
                </div>

                <div className="divide-y divide-[#eee9df]">
                  {/* Primary attendee */}
                  <AttendeeMealRow
                    number={1}
                    name={rsvpData.fullName}
                    mealPreference={
                      rsvpData.mealPreference
                    }
                    primary
                  />

                  {/* Family members */}
                  {rsvpData.familyMembers.map(
                    (member, index) => (
                      <AttendeeMealRow
                        key={`${member.name}-${index}`}
                        number={index + 2}
                        name={member.name}
                        mealPreference={
                          member.mealPreference
                        }
                      />
                    )
                  )}
                </div>
              </section>
            )}

            {/* ====================================================
                CONFIRMATION NUMBER
                ONLY FOR ATTENDEES
                ==================================================== */}

            {isAttending &&
              rsvpData.confirmationNumber && (
                <section className="mb-10">
                  <h2 className="text-base font-semibold text-[#292929]">
                    Confirmation Number
                  </h2>

                  <p className="mt-1 text-sm text-[#777]">
                    Keep this number for event check-in.
                  </p>

                  <p className="mt-4 text-3xl font-bold tracking-[0.12em] text-[#2f8a4b]">
                    {rsvpData.confirmationNumber}
                  </p>
                </section>
              )}

            {/* ====================================================
                NON ATTENDING MESSAGE
                ==================================================== */}

            {!isAttending && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-[#333]">
                  Response successfully recorded
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#777]">
                  No confirmation number is required
                  because you will not be attending.
                </p>
              </section>
            )}

            {/* ====================================================
                FOOTER
                ==================================================== */}

            <div className="border-t border-[#e8e4dc] pt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full"
                onClick={() => router.push("/")}
              >
                Back to Invitation
              </Button>

              <p className="mt-4 text-center text-xs leading-5 text-[#888]">
                Thank you for being part of this special
                occasion.
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}

/* ================================================================
   ATTENDEE MEAL ROW
   ================================================================ */

function AttendeeMealRow({
  number,
  name,
  mealPreference,
  primary = false,
}: {
  number: number;
  name: string;
  mealPreference: string;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#333]">
          {number}. {name}
        </p>

        <p className="mt-0.5 text-xs text-[#888]">
          {primary
            ? "Primary attendee"
            : "Family member"}
        </p>
      </div>

      <span className="shrink-0 text-sm font-medium text-[#444]">
        {mealPreference}
      </span>
    </div>
  );
}