import type { Metadata } from "next";
import { Inter, Baloo_2, Playfair_Display } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
/** Usadas solo por Hero (features/template-engine/sections/Hero.tsx) según
 * el `fontStack` de cada plantilla — ver types/template.ts. */
const playfulFont = Baloo_2({ subsets: ["latin"], variable: "--font-playful" });
const elegantFont = Playfair_Display({ subsets: ["latin"], variable: "--font-elegant" });

export const metadata: Metadata = {
  title: "Invitaciones digitales premium",
  description: "Crea y comparte invitaciones digitales para cualquier tipo de evento.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body
        className={`${bodyFont.variable} ${playfulFont.variable} ${elegantFont.variable} font-sans antialiased bg-white text-neutral-900`}
      >
        {children}
      </body>
    </html>
  );
}
