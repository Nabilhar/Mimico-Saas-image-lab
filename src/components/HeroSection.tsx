/**
 * HERO SECTION WITH TORONTO WATERFRONT BACKGROUND
 * 
 * Preserves original text content and structure while adding:
 * - Toronto waterfront background image with dark overlay
 * - Improved styling and visual hierarchy
 * - Responsive design
 */

import { SignUpButton, Show } from "@clerk/nextjs";
import Link from "next/link";

export function HeroSection() {

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Background image as <img> — fixes iOS Safari flickering caused by backgroundAttachment: fixed */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663472552182/iH7rHfPDawhK5LC5ERFxuc/toronto-waterfront-hero-SyAYkYnyuvqKd3e2YEkXZo.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          // On mobile, shift right so CN Tower (left-center of image) stays visible
          objectPosition: "30% center",
        }}
      />
 
      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/45" />
      
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-6 py-20 md:py-32 w-full">
        <div className="max-w-3xl">
          <div className="inline-block mb-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/40">
            <span className="text-xs font-semibold text-white">FOR TORONTO SMALL BUSINESSES</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-white">
            Your neighbours should be hearing from you — right now.
          </h1>
          
          <div className="text-lg text-white/90 mb-8 max-w-2xl space-y-1">
            <p>Shoreline Studio writes posts grounded in your neighbourhood — real landmarks, live weather, and your local context.</p>
            <p>You're running a business. You don't have time to be a content creator too.</p>
            <p>We generate the post at the moment you share it.</p>
            <p>You read it, copy it, and post it.</p>
            <p className="font-medium text-white">Get 15 free credits to try it out — No Credit Card Required.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Show when="signed-out">
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <button className="rounded-lg bg-white hover:bg-white/90 px-8 py-3 text-lg font-semibold text-cyan-800 shadow-lg transition">
                    Claim Your Free 15 Credits
                  </button>
                </SignUpButton>
                <span className="text-sm text-white/80 font-medium px-1">
                  * No Credit Card Required
                </span>
              </div>
            </Show>
            
            <Show when="signed-in">
              <Link href="/dashboard" className="rounded-lg bg-white hover:bg-white/90 px-8 py-3 text-lg font-semibold text-cyan-800 shadow-lg transition text-center">
                Open Your Dashboard
              </Link>
            </Show>
            
          </div>
        </div>
      </div>
    </section>
  );
}
