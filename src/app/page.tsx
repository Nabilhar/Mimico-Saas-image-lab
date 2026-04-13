"use client";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid auto-rows-[minmax(140px,auto)] gap-4 sm:gap-5 lg:grid-cols-12">
          {/* Hero Section */}
          <section className="bento-card relative overflow-hidden lg:col-span-12 lg:min-h-[320px]">
            <div className="relative z-10">
              <p className="text-sm font-medium uppercase tracking-wide text-cyan-800">Mimico · Toronto</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Social Media posts that sound like your neighbourhood.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-600">
                AI-powered captions for local businesses along the lakefront and Queensway. 
                Optimized for trust, not generic bots.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <Show when="signed-out">
                  <SignUpButton mode="modal" fallbackRedirectUrl="/profile">
                    <button className="rounded-xl bg-cyan-800 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-cyan-900 transition">
                      Start Building for Free
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard" className="rounded-xl bg-cyan-800 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-cyan-900 transition">
                    Open Your Dashboard
                  </Link>
                </Show>
              </div>
            </div>
          </section>

          {/* Bento Feature Cards */}
          <div className="bento-card lg:col-span-4">
            <h2 className="font-semibold text-slate-900">Local Context</h2>
            <p className="mt-2 text-sm text-slate-600">Preset niches for Mimico realtors, dentists, and cafes.</p>
          </div>
          <div className="bento-card lg:col-span-4">
            <h2 className="font-semibold text-slate-900">Proven Frameworks</h2>
            <p className="mt-2 text-sm text-slate-600">Uses PAS, AIDA, and BAB structures to drive engagement.</p>
          </div>
          <div className="bento-card lg:col-span-4">
            <h2 className="font-semibold text-slate-900">Safe & Secure</h2>
            <p className="mt-2 text-sm text-slate-600">Your data stays local; your API keys stay protected.</p>
          </div>
        </div>
      </main>
    </>
  );
}