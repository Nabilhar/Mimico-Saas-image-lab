import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Add this for a modern look
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Harbourline Studio — Social posts for Mimico businesses",
  description:
    "AI-assisted social content for dentists, realtors, and cafés in Mimico, Toronto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* We add the font class here so it applies to every page */}
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}