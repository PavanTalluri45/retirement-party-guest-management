"use client";

import { useEffect, useState } from "react";

import { ConfirmationCard } from "@/components/confirmation-card";
import { NotFoundContent } from "@/components/rsvp-form/sections/notfoundcontent";
import { SESSION_STORAGE_KEY } from "@/components/rsvp-form/constants";
import type { RSVPData } from "@/types/rsvp";

type Status = "checking" | "found" | "not-found";

export default function ConfirmationPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [rsvpData, setRsvpData] = useState<RSVPData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!storedData) {
      setStatus("not-found");
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as RSVPData;
      setRsvpData(parsedData);
      setStatus("found");
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setStatus("not-found");
    }
  }, []);

  // Brief blank frame while we check sessionStorage on mount, so we don't
  // flash the 404 for legitimate visitors before the check has run.
  if (status === "checking") {
    return null;
  }

  if (status === "not-found" || !rsvpData) {
    return (
      <NotFoundContent
        heading="RSVP not found"
        description="We couldn't find a response for this page. Please return to the invitation and complete the RSVP form."
      />
    );
  }

  return <ConfirmationCard rsvpData={rsvpData} />;
}