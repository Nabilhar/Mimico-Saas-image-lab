import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css' // This keeps your styling working


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}


export const metadata: Metadata = {
  title: "Harbourline Studio — Social posts for Mimico businesses",
  description:
    "AI-assisted social content for dentists, realtors, and cafés in Mimico, Toronto.",
};

