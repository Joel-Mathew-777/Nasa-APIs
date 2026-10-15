import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://nasa-ap-is-brown.vercel.app"),
  title: { default: "Open NASA", template: "%s · Open NASA" },
  description: "A live tour of what NASA's open APIs can tell you, right now.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>
              Data courtesy of NASA, JPL, Caltech/IPAC, NOAA, The Space Devs and CelesTrak. Not affiliated with
              or endorsed by NASA.
            </p>
            <a href="https://api.nasa.gov" className="text-muted transition-colors hover:text-white">
              api.nasa.gov ↗
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
