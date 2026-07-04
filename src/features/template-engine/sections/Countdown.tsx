"use client";

import { motion } from "framer-motion";
import { useCountdown } from "@/features/public-invitation/useCountdown";

interface CountdownProps {
  target: Date;
  variant: "cards" | "minimal" | "flip";
}

const UNIT_LABELS = { days: "días", hours: "hrs", minutes: "min", seconds: "seg" } as const;
const UNITS = ["days", "hours", "minutes", "seconds"] as const;

export function Countdown({ target }: CountdownProps) {
  const parts = useCountdown(target);

  if (parts.isPast) {
    return (
      <div className="py-8 text-center text-neutral-600">
        <p className="text-lg font-medium">¡Ya estamos celebrando! 🎉</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-3 py-8 sm:gap-4">
      {UNITS.map((unit) => (
        <motion.div
          key={unit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-16 flex-col items-center rounded-2xl bg-[var(--theme-primary)]/10 py-3 sm:w-20"
        >
          <span className="text-2xl font-semibold text-[var(--theme-primary)] sm:text-3xl">
            {String(parts[unit]).padStart(2, "0")}
          </span>
          <span className="text-xs text-neutral-500">{UNIT_LABELS[unit]}</span>
        </motion.div>
      ))}
    </div>
  );
}
