import type { Timestamp } from "firebase/firestore";
import { DEFAULT_LOCALE } from "@/lib/constants";

export function toDate(value: Timestamp | Date): Date {
  return value instanceof Date ? value : value.toDate();
}

export function formatEventDate(value: Timestamp | Date, locale: string = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toDate(value));
}

/**
 * Formatea un Date a "YYYY-MM-DD" usando componentes LOCALES (no
 * toISOString, que es UTC y puede correr la fecha un día si la hora del
 * evento está cerca de medianoche). Se usa para precargar <input
 * type="date"> en la pantalla de edición con la misma fecha que el
 * organizador capturó originalmente.
 */
export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function getCountdownParts(target: Date, now: Date = new Date()): CountdownParts {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
  };
}
