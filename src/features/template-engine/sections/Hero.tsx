"use client";

import { motion } from "framer-motion";
import type { InvitationViewModel } from "@/types/invitationView";
import type { FontStack } from "@/types/template";

interface HeroProps {
  invitation: InvitationViewModel;
  variant: "centered" | "split" | "fullBleed" | "poster";
  fontStack: FontStack;
}

const HEADING_FONT_CLASS: Record<FontStack, string> = {
  modern: "font-sans",
  playful: "font-playful",
  elegant: "font-elegant",
};

export function Hero({ invitation, variant, fontStack }: HeroProps) {
  const backgroundImage = invitation.images.cover || invitation.images.hero;

  if (variant === "poster" && backgroundImage) {
    return (
      <section className="flex justify-center bg-neutral-100 px-4 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundImage}
          alt={`Invitación de ${invitation.hostName}`}
          className="w-full max-w-md rounded-3xl object-contain shadow-sm"
        />
      </section>
    );
  }

  return (
    <section
      className="relative flex min-h-[70vh] flex-col items-center justify-end overflow-hidden bg-neutral-200 bg-cover bg-center px-6 pb-12 pt-24 text-center text-white"
      style={{
        backgroundImage: backgroundImage
          ? `linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.15)), url(${backgroundImage})`
          : undefined,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {invitation.theme && (
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-white/80">
            {invitation.theme}
          </p>
        )}
        <h1 className={`text-3xl font-semibold sm:text-5xl ${HEADING_FONT_CLASS[fontStack]}`}>
          {invitation.hostName}
        </h1>
        {invitation.age !== undefined && (
          <p className="mt-2 text-lg text-white/90">cumple {invitation.age} años</p>
        )}
      </motion.div>
    </section>
  );
}
