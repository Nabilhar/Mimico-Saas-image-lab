import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { MobileNav } from "@/components/MobileNav";
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shoreline Studio — Social posts for Toronto businesses",
  description:
    "AI-assisted social content for dentists, realtors, and cafés in Toronto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <main className="min-h-screen pb-24 sm:pb-10 w-full relative">
            {children}
          </main>
          <MobileNav />
          {/* This is the "container" that allows your toasts to pop up */}
          <Toaster 
            position="bottom-center" 
            containerStyle={{
              bottom: 80, // This shifts the toast 80px up from the bottom
            }}
            toastOptions={{
              // Optional: Make toasts look more like your theme
              style: {
                background: '#0f172a', // slate-900
                color: '#fff',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
          <Analytics /> 
        </body>
      </html>
    </ClerkProvider>
  );
}