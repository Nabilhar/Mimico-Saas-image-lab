"use client";

import { Show, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Zap, MapPin, Users, History, Watch, Timer, Radio, Clock, } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Landing Page for Mimico Content AI
 * Integrated with Next.js, Clerk Auth, and Supabase
 * Design: Clean, professional, Mimico Blue primary (#2563eb)
 */

export default function Home() {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToExamples = () => {
    const examplesSection = document.getElementById("examples");
    if (examplesSection) {
      examplesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !businessName || !address) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          business_name: businessName,
          address: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to join waitlist");
        return;
      }

      setWaitlistPosition(data.position);
      toast.success(`Welcome! You're #${data.position} on the waitlist.`);
      setEmail("");
      setBusinessName("");
      setAddress("");
    } catch (error) {
      console.error("Waitlist signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="w-full">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6 py-20 md:py-32">
            <div className="max-w-3xl">
              <div className="inline-block mb-4 px-3 py-1 bg-slate-50 rounded-full border border-blue-100">
                <span className="text-xs font-semibold text-cyan-800">FOR TORONTO SMALL BUSINESSES</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-slate-900">
                Your neighbours should be hearing from you—right now.
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              You're running a business—you don't have time to be a content creator too.
              Harbourline Studio creates posts at the moment you share them, not weeks in advance. <br />
              Using real-time local context like weather,
              neighbourhood events, and what's happening around your business. <br />
              Get 15 free credits to try it out — No Credit Card Required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Show when="signed-out">
                 <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <button className="rounded-lg bg-cyan-800 hover:bg-cyan-900 px-8 py-3 text-lg font-semibold text-white shadow-lg transition">
                      Claim Your Free 15 Credits
                    </button>
                  </SignUpButton>
                  <span className="text-sm text-slate-500 font-medium px-1">
                    * No Credit Card Required
                  </span>
                </div>
                  
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard" className="rounded-lg bg-cyan-800 hover:bg-cyan-900 px-8 py-3 text-lg font-semibold text-white shadow-lg transition text-center">
                    Open Your Dashboard
                  </Link>
                </Show>
                <button onClick={scrollToExamples} className="rounded-lg border border-slate-300 hover:border-slate-400 px-8 py-3 text-lg font-semibold text-slate-900 transition">
                  See Examples
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Why Harbourline Studio is Different</h2>
              <p className="text-slate-600 max-w-2xl">
                We built the only content AI engine designed specifically for local businesses.<br />
                Here is what sets us apart.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-slate-200">
                <CardHeader>
                  <Watch className="w-8 h-8 text-cyan-800 mb-2 animate-bounce" />
                  <CardTitle>In the Now</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                  Every post is generated at the time you share it—based on real-time local signals like weather, events, and neighbourhood activity.
                  No bulk scheduling. No stale content.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader>
                  <MapPin className="w-8 h-8 text-cyan-800 mb-2 animate-bounce" />
                  <CardTitle>Local Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                  Your posts reference real places and context your customers recognize—so your customers feel like
                  it's coming from someone who's actually there.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader>
                  <Radio className="w-8 h-8 text-cyan-800 mb-2 animate-ping" />
                  <CardTitle>Your Voice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                  Set your tone once. Harbourline Studio writes like you—so every post sounds consistent, without you writing anything.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

                {/* How It Works Section */}
                <section className="bg-slate-50 py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">How It Works</h2>
              <p className="text-slate-600 max-w-2xl">
                Three simple steps to professional social media posts that sound like you.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Step 1 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-800 text-white font-bold text-lg">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Choose Your Niche</h3>
                </div>
                <p className="text-slate-600 mb-3 flex-grow">
                  Select your industry (e.g.,Restaurant, Real Estate, Chiropractor,Dentist, Café, Salon). We immediately understand your customers, tone, and what matters in your neighbourhood.
                </p>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-sm font-semibold text-cyan-800">✓ Built specifically for local businesses<br /> 
                  ✓ Preset Niches</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-800 text-white font-bold text-lg">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Add Real-Time Local Context</h3>
                </div>
                <p className="text-slate-600 mb-3 flex-grow">
                Every post is generated using live local signals—weather, landmarks, neighbourhood events, seasonal context, and time of day—so your content reflects what's happening right now.
                You can also include Promotions/Offers, and the AI naturally weaves them into the post in a way that feels organic.
                </p>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-sm font-semibold text-cyan-800">✓ Always context-aware<br /> 
                  ✓ Naturally includes your offers when relevant</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-800 text-white font-bold text-lg">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Generate & Share Instantly</h3>
                </div>
                <p className="text-slate-600 mb-3 flex-grow">
                Create a post for this exact moment and share it in seconds with your prefered social media platform. No templates. No batching. No pre-written content.
                </p>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-sm font-semibold text-cyan-800">✓ Ready in 30 seconds<br /> 
                  ✓ Built for real-time posting</p>
                </div>
              </div>
            </div>

            {/* Habit Builder Callout */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 flex-shrink-0">
                  <Watch className="h-5 w-5 text-cyan-800" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Time-to-Post-Alerts (Timing Reminders)</h4>
                  <p className="text-slate-600">
                    We notify you when it's time to post—based on your custom schedule.<br />
                    Tap the alert, generate a fresh post  and share it while it still matters..<br />
                    <br />
                    ✓ No content stored in advance<br />
                    ✓ No forgotten posting days<br />
                    ✓ Always create posts in the moment<br />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="bg-white py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">See It In Action</h2>
              <p className="text-slate-600 max-w-2xl">
                Here is what Mimico generated for different business types in Toronto.
              </p>
            </div>
            <Tabs defaultValue="restaurant" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
                <TabsTrigger value="salon">Salon</TabsTrigger>
                <TabsTrigger value="realtor">Real Estate</TabsTrigger>
              </TabsList>

              <TabsContent value="restaurant" className="space-y-4">
                <div className="flex flex-col bg-white sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-md mx-auto">
                  {/* ── HEADER ── */}
                  <div className="p-4 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      T
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Canada by the Lake</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Mimico, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Apr 11, 5:11 PM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── CAPTION ── */}
                  <div className="px-4 pb-3 text-left">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`When you're searching for the best dinner in Mimico, the options can be overwhelming.

On a crisp April evening, you can walk along the lake shore and enjoy the sunset views while savoring a warm meal at our place.

We've put together some tips to make the most of your spring evenings:

1. Take a stroll along the lake before dinner to work up an appetite.

2. Try our seasonal menu featuring fresh, locally-sourced ingredients.

3. Book a table by the window to catch the sunset.

4. Pair your meal with a craft beer from a local brewery.

5. End your evening with a walk to Amos Waites Park to enjoy the spring blooms.

If your evening is still wide open, we have a table with your name on it.

#Mimico #LakeShoreDining #TorontoEats #SpringVibes`}
                    </p>
                  </div>

                  {/* ── IMAGE (Real AI Post Preview) ── */}
                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100 shrink-0">
                    <img 
                      src="/images/mimico-dinner-preview.jpg" 
                      alt="AI Post Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* ── NON-CLICKABLE ACTIONS FOOTER ── */}
                  <div className="px-4 py-4 flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400 text-xs cursor-default">
                        📋 Copy text
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400 text-xs cursor-default">
                        🖼️ Copy image
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-800/10 text-cyan-800 text-xs font-bold cursor-default">
                      🚀 Share kit
                    </div>
                  </div>
                </div>
                
                {/* Credit indicator to maintain the "value" message from the original landing page */}
                <p className="text-center text-xs text-slate-400 mt-2">2 Credits • Ready to post</p>
              </TabsContent>

              <TabsContent value="salon" className="space-y-4">
                <div className="flex flex-col bg-white sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-md mx-auto">
                  {/* ── HEADER ── */}
                  <div className="p-4 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      T
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Riverdale Barbershop</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Riverdale, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Apr 12, 3:35 PM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── CAPTION ── */}
                  <div className="px-4 pb-3 text-left">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`I keep hearing more folks talking about the bike to work buzz on Queen Street, and the spring wind makes my hair a bit rebellious.  

When you settle into the chair, the scent of fresh coffee ☕ mixes with the hum of the street outside, and you walk out feeling the crisp April sun 🌞 on a neatly trimmed look, ready for a stroll to Riverdale Park.  

Since the evenings are getting longer and the patio at Danforth is calling, I figured a little break on the wallet would be welcome—so we’re giving you 15% until April 20th. Just flash this post on your phone when you swing by, and we’ll take care of the rest. No appointment needed; the chair’s ready if you want a fresh cut before meeting friends at the library.  

#Riverdale #Barbershop #TorontoStyle`}
                    </p>
                  </div>

                  {/* ── IMAGE (Real AI Post Preview) ── */}
                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100 shrink-0">
                    <img 
                      src="/images/mimico-barbershop-preview.jpg" 
                      alt="AI Post Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* ── NON-CLICKABLE ACTIONS FOOTER ── */}
                  <div className="px-4 py-4 flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400 text-xs cursor-default">
                        📋 Copy text
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400 text-xs cursor-default">
                        🖼️ Copy image
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-800/10 text-cyan-800 text-xs font-bold cursor-default">
                      🚀 Share kit
                    </div>
                  </div>
                </div>
                
                {/* Credit indicator to maintain the "value" message from the original landing page */}
                <p className="text-center text-xs text-slate-400 mt-2">2 Credits • Ready to post</p>
              </TabsContent>



              <TabsContent value="realtor" className="space-y-4">
                <div className="flex flex-col bg-white sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-md mx-auto">
                  {/* ── HEADER ── */}
                  <div className="p-4 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      T
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Toronto Real Estate Agent Team</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">College St, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Apr 14, 4:32 PM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── CAPTION ── */}
                  <div className="px-4 pb-3 text-left">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`Watching prices climb while waiting for interest rate shifts in the Little Italy real estate market creates a nagging sense of missed opportunity that is difficult to shake.

Delaying your entry into the downtown core often means paying a much higher premium for the same property once the sidelined buyers inevitably return to the market.

We specialize in identifying these specific windows of opportunity by prioritizing long-term equity potential over the volatility of immediate monthly payments. Our team spends significant time tracking the granular inventory shifts near Spadina Avenue and the Annex to ensure our clients make moves based on hard data rather than emotional momentum. We provide the clarity needed to distinguish between a temporary market lull and a genuine entry point.

We are in the office if you want to sit down and look at the actual numbers.

#LittleItalyToronto #TorontoRealEstate #RealEstateInvesting`}
                    </p>
                  </div>

                  {/* ── IMAGE (Real AI Post Preview) ── */}
                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100 shrink-0">
                    <img 
                      src="/images/mimico-realtor-preview.jpg" 
                      alt="AI Post Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* ── NON-CLICKABLE ACTIONS FOOTER ── */}
                  <div className="px-4 py-4 flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400 text-xs cursor-default">
                        📋 Copy text
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400 text-xs cursor-default">
                        🖼️ Copy image
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-800/10 text-cyan-800 text-xs font-bold cursor-default">
                      🚀 Share kit
                    </div>
                  </div>
                </div>
                
                {/* Credit indicator to maintain the "value" message from the original landing page */}
                <p className="text-center text-xs text-slate-400 mt-2">2 Credits • Ready to post</p>
              </TabsContent>
            </Tabs>
          </div>
        </section>

                {/* CTA Section */}
                <section id="cta" className="bg-slate-50 py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Join the Beta Waitlist</h2>
              <p className="text-slate-600 mb-8">
                Be among the first to access Mimico when we launch. Secure your early adopter discount and get direct access to our team for feedback and support.
              </p>
              <form onSubmit={handleWaitlistSignup} className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
                <div>
                  <Label htmlFor="business-name" className="text-sm font-medium text-slate-900">
                    Business Name
                  </Label>
                  <Input
                    id="business-name"
                    placeholder="e.g., By The Lake Pizza"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-2 border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-slate-900">
                    Business Address (including Postal Code)
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g., 2415 Lake Shore Blvd W, Toronto, M8V 1E5"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-2 border-slate-300"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    We use your exact location to find nearby landmarks and events.
                  </p>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-slate-900">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 border-slate-300"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-cyan-800 hover:bg-cyan-900 text-white"
                >
                  {isSubmitting ? "Joining..." : "Join the Waitlist"}
                </Button>
              </form>
              {waitlistPosition && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-start gap-3 border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">You're on the beta waitlist!</p>
                    <p className="text-sm text-slate-600">
                      You are #{waitlistPosition} in line. We will email you when beta access is ready with your early adopter discount.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-white py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Simple, Transparent Pricing</h2>
              <p className="text-slate-600 max-w-2xl">
                Pay only for what you use. No subscriptions, no minimums.<br /> 
                Beta pricing coming soon — join the waitlist to lock in your early rate.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Text Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">1 <span className="text-lg text-slate-600">credit</span></p>
                  <p className="text-slate-600 text-sm mb-4">
                    5 tips, myth-busting, community spotlights, and more.
                  </p>
                  <p className="text-xs text-slate-500">Caption + hashtags</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>AI Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">2 <span className="text-lg text-slate-600">credits</span></p>
                  <p className="text-slate-600 text-sm mb-4">
                    Custom AI-generated image to match your post.
                  </p>
                  <p className="text-xs text-slate-500">Image only</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 md:col-span-2">
                <CardHeader>
                  <CardTitle>Text + AI Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">3 <span className="text-lg text-slate-600">credits</span></p>
                  <p className="text-slate-600 text-sm mb-4">
                    Complete package: post + custom AI-generated image.
                  </p>
                  <p className="text-xs text-slate-500">Most popular • Caption + hashtags + image</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Early Adopter Tiers */}
        <section className="bg-white py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Early Adopter Perks</h2>
              <p className="text-slate-600 max-w-2xl">
                Join our beta and get exclusive discounts on your first year of credits.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
              <Card className="border-2 border-blue-600 bg-slate-50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>First 50 Signups</CardTitle>
                    <Zap className="w-5 h-5 text-cyan-800" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">50% <span className="text-lg text-slate-600">off</span></p>
                  <p className="text-slate-600 text-sm">
                    Get 50% off credit prices for your entire first year.
                  </p>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-slate-600">Spots filled: <strong>12 / 50</strong></p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>Next 50 Signups</CardTitle>
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">25% <span className="text-lg text-slate-600">off</span></p>
                  <p className="text-slate-600 text-sm">
                    Get 25% off credit prices for your entire first year.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600">Spots filled: <strong>0 / 50</strong></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
