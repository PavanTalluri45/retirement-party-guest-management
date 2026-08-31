"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function InvitationPanel() {
  return (
    <motion.section
      initial={{ x: -70, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative hidden h-[42vh] overflow-hidden bg-[#f3f1ec] lg:block lg:h-screen"
    >
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
    </motion.section>
  );
}