import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
        <body className={inter.className}>
          {children}
          
          {/* This is the "container" that allows your toasts to pop up */}
          <Toaster position="bottom-center" /> 
        </body>
      </html>
    </ClerkProvider>
  );
}