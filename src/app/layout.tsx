import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harmonix — Unified Music",
  description: "Search, mix and play Spotify and YouTube Music in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 font-sans">
        {children}
      </body>
    </html>
  );
}
