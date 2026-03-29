"use client";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GenerateDashboard } from "@/components/GenerateDashboard";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from 'react';



export default function Home() {
  // This creates the 'history' list and the 'setHistory' tool to update it
const [history, setHistory] = useState<any[]>([]);
// Inside your main function:
const { user } = useUser();

useEffect(() => {
  // Only load history if we have a user ID
  if (user) {
    const saved = localStorage.getItem(`history_${user.id}`);
    if (saved) setHistory(JSON.parse(saved));
  }
}, [user]);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid auto-rows-[minmax(140px,auto)] gap-4 sm:gap-5 lg:grid-cols-12">
          {/* Hero — spans wide */}
          <section className="bento-card relative overflow-hidden lg:col-span-8 lg:row-span-2 lg:min-h-[280px]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-100/80 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-slate-200/60 blur-3xl" />
            <div className="relative">
              <p className="text-sm font-medium uppercase tracking-wide text-cyan-800">Micro-SaaS · Mimico, Toronto</p>
              <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                Social posts that sound like your neighbourhood—not a generic bot.
              </h1>
              <p className="mt-4 max-w-lg text-slate-600">
                Harbourline Studio helps dentists, realtors, and cafés draft scroll-stopping captions with AI, tuned for
                local credibility around the lakefront and Queensway corridor.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="#generator"
                  className="inline-flex items-center justify-center rounded-xl bg-cyan-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-900"
                >
                  Try the generator
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-cyan-700 hover:text-cyan-900"
                >
                  Open dashboard
                </Link>
              </div>
            </div>
          </section>

          {/* Tall stat column */}
          <aside className="bento-card-muted flex flex-col justify-between lg:col-span-4 lg:row-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Local-first</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">Mimico</p>
              <p className="mt-1 text-sm text-slate-600">
                Etobicoke&apos;s lakeside village—perfect for businesses that thrive on trust and repeat customers.
              </p>
            </div>
            <ul className="mt-6 space-y-3 border-t border-slate-200/80 pt-6 text-sm text-slate-600">
              <li className="flex justify-between gap-4">
                <span>Niches</span>
                <span className="font-medium text-slate-900">3 presets</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Formats</span>
                <span className="font-medium text-slate-900">Tips & myths</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Engine</span>
                <span className="font-medium text-slate-900">Gemini</span>
              </li>
            </ul>
          </aside>

          <div className="bento-card lg:col-span-4">
            <h2 className="text-sm font-semibold text-slate-900">Pick your vertical</h2>
            <p className="mt-2 text-sm text-slate-600">
              Dentist, Realtor, or Cafe—each path uses prompts shaped for compliance, listings, or daily specials.
            </p>
          </div>

          <div className="bento-card lg:col-span-4">
            <h2 className="text-sm font-semibold text-slate-900">Structured formats</h2>
            <p className="mt-2 text-sm text-slate-600">
              “5 Tips” for quick value posts; “Myth-Buster” to educate and build authority in the feed.
            </p>
          </div>

          <div className="bento-card lg:col-span-4">
            <h2 className="text-sm font-semibold text-slate-900">Gemini on the server</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your key stays in <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">.env.local</code>
              . The page only receives the finished caption from{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">/api/generate</code>.
            </p>
          </div>

          <section
            id="generator"
            className="scroll-mt-24 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 shadow-sm sm:p-8 lg:col-span-12"
          >
            <p className="text-sm font-medium uppercase tracking-wide text-cyan-800">Live generator</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Create a post from the landing page
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Same niche and format controls as the dashboard—pick options, hit Generate, and copy your draft below.
            </p>
            <div className="mt-8">
              <GenerateDashboard />
            </div>
          </section>
        </div>
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Harbourline Studio · Mimico, Toronto
      </footer>
    </>
  );
}
