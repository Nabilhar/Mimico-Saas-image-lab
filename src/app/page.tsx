"use client";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="w-full mx-auto max-w-6xl px-0 sm:px-6 py-8 sm:py-16">
        <div className="grid auto-rows-auto gap-0 sm:gap-5 lg:grid-cols-12">
          {/* Hero Section */}
          <section className="relative overflow-hidden lg:col-span-12 lg:min-h-[320px] bg-slate-50 border-y sm:border sm:rounded-3xl px-6 py-12 sm:px-12">
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-800">Mimico · Toronto</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
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
          <div className="p-6 border-b sm:border sm:rounded-2xl lg:col-span-4 bg-white">
            <h2 className="font-semibold text-slate-900">Local Context</h2>
            <p className="mt-2 text-sm text-slate-600">Preset niches for Mimico realtors, dentists, and cafes.</p>
          </div>
          <div className="p-6 border-b sm:border sm:rounded-2xl lg:col-span-4 bg-white">
            <h2 className="font-semibold text-slate-900">Proven Frameworks</h2>
            <p className="mt-2 text-sm text-slate-600">Uses PAS, AIDA, and BAB structures to drive engagement.</p>
          </div>
          <div className="p-6 border-b sm:border sm:rounded-2xl lg:col-span-4 bg-white">
            <h2 className="font-semibold text-slate-900">Safe & Secure</h2>
            <p className="mt-2 text-sm text-slate-600">Your data stays local; your API keys stay protected.</p>
          </div>
        </div>
      </main>
    </>
  );
}