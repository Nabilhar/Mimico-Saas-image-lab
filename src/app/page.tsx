
// Landing Page
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
import { HeroSection } from "@/components/HeroSection";
import { GallerySection } from "@/components/GallerySection";
import "flag-icons/css/flag-icons.min.css";

/**
 * Landing Page for Shoreline Content AI
 * Integrated with Next.js, Clerk Auth, and Supabase
 * Design: Clean, professional, Shoreline Blue primary (#2563eb)
 */

export default function Home() {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province_state, setProvinceState] = useState("");
  const [country, setCountry] = useState("Canada"); // Default to Canada
  const [postalCode, setPostalCode] = useState("");
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
    // Updated validation to check all new fields
    if (!email || !businessName || !country || !postalCode) {
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
          street,
          city,   
          province_state,
          country,
          postal_code: postalCode,
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
      setStreet("");
      setCity("");
      setProvinceState("");
      setCountry("Canada");
      setPostalCode("");
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
        <HeroSection />

        {/* Gallery Section */}
        <GallerySection />

        {/* Features Section */}
        <section className="bg-white py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Why Shoreline Studio is Different</h2>
              <div className="text-slate-600 max-w-2xl space-y-2">
                <p>We built the only content AI engine designed specifically for local businesses.</p>
                <p>Here is what sets us apart</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-slate-200">
                <CardHeader>
                  <Watch className="w-8 h-8 text-cyan-800 mb-2" />
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
                  <MapPin className="w-8 h-8 text-cyan-800 mb-2" />
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
                  Set your tone once. Shoreline Studio writes like you—so every post sounds consistent, without you writing anything.
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
                  Select your industry (e.g.,Restaurant, Real Estate, Chiropractor,Dentist, Café, Salon). Add the address, upload a photo of your storefront / logo and the AI learns your exact colors, style, and neighbourhood — so every post and image feels like it came from your business specifically.
                </p>
                <div className="flex flex-col gap-1 text-sm font-semibold text-cyan-800">
                  <span>✓ Built specifically for local businesses</span>
                  <span>✓ Preset Niches</span>
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
                You can also include Promotions/Offers, and the AI Engin naturally weaves them into the post in a way that feels organic.
                </p>
                <div className="flex flex-col gap-1 text-sm font-semibold text-cyan-800">
                  <span>✓ Always context-aware</span>
                  <span>✓ Naturally includes your offers when relevant</span>
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
                Create a post for this exact moment, copy and share it in seconds with your prefered social media platform. No templates. No batching. No pre-written content.
                </p>
                <div className="flex flex-col gap-1 text-sm font-semibold text-cyan-800">
                  <span>✓ Ready in 30 seconds</span>
                  <span>✓ Built for real-time posting</span>
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
                  
                  <div>
                    <div className="text-slate-600 mb-4 space-y-2">
                      <p>Set your schedule once and Shoreline exports it directly to your calendar.</p>
                      <p>Your calendar app reminds you when it's time to post.</p>
                      <p>Tap the alert, generate a fresh post and share it while it still matters.</p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm font-semibold text-cyan-800">
                      <div className="flex items-center gap-2">
                        <span>✓</span> <span>No content stored in advance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>✓</span> <span>No forgotten posting days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>✓</span> <span>Always create posts in the moment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>  
        </section>

        {/* Examples Section */}
        {/* <section id="examples" className="bg-white py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">See It In Action</h2>
              <p className="text-slate-600 max-w-2xl">
                Here is what Shoreline Studio generated for different business types in Toronto.
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

              
                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100 shrink-0">
                    <img 
                      src="/images/Shoreline-dinner-preview.jpg" 
                      alt="AI Post Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                 
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
                
              
                <p className="text-center text-xs text-slate-400 mt-2">3 Credits • Ready to post</p>
              </TabsContent>

              <TabsContent value="salon" className="space-y-4">
                <div className="flex flex-col bg-white sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-md mx-auto">
              
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

           
                  <div className="px-4 pb-3 text-left">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`I keep hearing more folks talking about the bike to work buzz on Queen Street, and the spring wind makes my hair a bit rebellious.  

When you settle into the chair, the scent of fresh coffee ☕ mixes with the hum of the street outside, and you walk out feeling the crisp April sun 🌞 on a neatly trimmed look, ready for a stroll to Riverdale Park.  

Since the evenings are getting longer and the patio at Danforth is calling, I figured a little break on the wallet would be welcome—so we’re giving you 15% until April 20th. Just flash this post on your phone when you swing by, and we’ll take care of the rest. No appointment needed; the chair’s ready if you want a fresh cut before meeting friends at the library.  

#Riverdale #Barbershop #TorontoStyle`}
                    </p>
                  </div>

              
                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100 shrink-0">
                    <img 
                      src="/images/Shoreline-barbershop-preview.jpg" 
                      alt="AI Post Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

             
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
                
          
                <p className="text-center text-xs text-slate-400 mt-2">3 Credits • Ready to post</p>
              </TabsContent>



              <TabsContent value="realtor" className="space-y-4">
                <div className="flex flex-col bg-white sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-md mx-auto">
               
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

            
                  <div className="px-4 pb-3 text-left">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`Watching prices climb while waiting for interest rate shifts in the Little Italy real estate market creates a nagging sense of missed opportunity that is difficult to shake.

Delaying your entry into the downtown core often means paying a much higher premium for the same property once the sidelined buyers inevitably return to the market.

We specialize in identifying these specific windows of opportunity by prioritizing long-term equity potential over the volatility of immediate monthly payments. Our team spends significant time tracking the granular inventory shifts near Spadina Avenue and the Annex to ensure our clients make moves based on hard data rather than emotional momentum. We provide the clarity needed to distinguish between a temporary market lull and a genuine entry point.

We are in the office if you want to sit down and look at the actual numbers.

#LittleItalyToronto #TorontoRealEstate #RealEstateInvesting`}
                    </p>
                  </div>

          
                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100 shrink-0">
                    <img 
                      src="/images/Shoreline-realtor-preview.jpg" 
                      alt="AI Post Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

          
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
                
                <p className="text-center text-xs text-slate-400 mt-2">3 Credits • Ready to post</p>
              </TabsContent>
            </Tabs>
          </div>
        </section> */}

        {/* Early Adopter Tiers */}
        <section className="bg-slate-50 py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Early Adopter Perks</h2>
              <p className="text-slate-600 max-w-2xl">
                Join our beta launch and secure your exclusive discounts on your first year of credits.
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
                    Get 50% off credit prices for your first 6 months.
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
                    Get 25% off credit prices for your first 6 months.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600">Spots filled: <strong>0 / 50</strong></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-white py-16 md:py-24 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Simple, Transparent Pricing</h2>
              <div className="text-slate-600 max-w-2xl space-y-2">
                <p>No subscriptions. Buy credits, use them when you post.</p>
                <p>Early adopter pricing active now — 50% off your first 6 months.</p>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">

              {/* Starter */}
              <div className="flex flex-col gap-2 p-5 rounded-2xl border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-cyan-50 text-cyan-800 w-fit">Starter</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">75 credits / month</p>
                <p className="text-sm text-slate-500 leading-relaxed">Up to 15 complete posts. Perfect for posting a few times a week.</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">$49</span>
                  <span className="text-2xl font-bold text-slate-900">$25</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <span className="text-[11px] font-semibold text-cyan-700">50% off — first 6 months</span>
                <hr className="border-slate-100 my-1" />
                <div className="flex justify-between text-sm text-slate-500"><span>Complete posts</span><span className="font-semibold text-slate-900">up to 15</span></div>
                <div className="flex justify-between text-sm text-slate-500"><span>Cost per post</span><span className="font-semibold text-slate-900">$1.66</span></div>
              </div>

              {/* Daily — featured */}
              <div className="flex flex-col gap-2 p-5 rounded-2xl border-2 border-blue-600 bg-white">
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-cyan-700 text-white w-fit">Most popular</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">160 credits / month</p>
                <p className="text-sm text-slate-500 leading-relaxed">Up to 32 complete posts. One post every day, with room to spare.</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">$89</span>
                  <span className="text-2xl font-bold text-slate-900">$45</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <span className="text-[11px] font-semibold text-cyan-700">50% off — first 6 months</span>
                <hr className="border-slate-100 my-1" />
                <div className="flex justify-between text-sm text-slate-500"><span>Complete posts</span><span className="font-semibold text-slate-900">up to 32</span></div>
                <div className="flex justify-between text-sm text-slate-500"><span>Cost per post</span><span className="font-semibold text-slate-900">$1.40</span></div>
              </div>

              {/* Growth */}
              <div className="flex flex-col gap-2 p-5 rounded-2xl border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-cyan-50 text-cyan-800 w-fit">Growth</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">350 credits / month</p>
                <p className="text-sm text-slate-500 leading-relaxed">Up to 70 complete posts. For businesses posting multiple times a day.</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">$169</span>
                  <span className="text-2xl font-bold text-slate-900">$85</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <span className="text-[11px] font-semibold text-cyan-700">50% off — first 6 months</span>
                <hr className="border-slate-100 my-1" />
                <div className="flex justify-between text-sm text-slate-500"><span>Complete posts</span><span className="font-semibold text-slate-900">up to 70</span></div>
                <div className="flex justify-between text-sm text-slate-500"><span>Cost per post</span><span className="font-semibold text-slate-900">$1.21</span></div>
              </div>

            </div>

            {/* How credits work */}
            <div className="bg-slate-50 rounded-2xl p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">How credits work</p>
              <div className="flex justify-between items-center text-sm text-slate-500 py-1">
                <span>Text post (caption + hashtags)</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-700">2 credits</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500 py-1">
                <span>Matching AI image</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-700">3 credits</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-slate-900 py-1 mt-2 pt-3 border-t border-slate-200">
                <span>Complete post (text + image)</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-cyan-700 text-white">5 credits</span>
              </div>
            </div>

          </div>
        </section>
        

      {/* CTA Section */}
      <section id="cta" className="bg-slate-50 py-16 md:py-24 border-b">
        <div className="mx-auto max-w-6xl px-6 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Join the Beta Waitlist</h2>
            <p className="text-slate-600 mb-8">
              Be among the first to access Shoreline Studio when we launch. Secure your early adopter discount and get direct access to our team for feedback and support.
            </p>
            <form onSubmit={handleWaitlistSignup} className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
              
              {/* Business Name */}
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
                  required
                />
              </div>

            

              {/* Structured Address Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Structured Address Made simle 
                <div className="md:col-span-2">
                  <Label htmlFor="street" className="text-sm font-medium text-slate-900">
                    Street Address
                  </Label>
                  <Input
                    id="street"
                    placeholder="e.g., 2415 Lake Shore Blvd W"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="mt-2 border-slate-300"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-slate-900">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g., Toronto"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-2 border-slate-300"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="province-state" className="text-sm font-medium text-slate-900">
                    Province / State
                  </Label>
                  <Input
                    id="province-state"
                    placeholder="e.g., ON or Ontario"
                    value={province_state}
                    onChange={(e) => setProvinceState(e.target.value)}
                    className="mt-2 border-slate-300"
                    required
                  />
                </div>
                ------------------------------------*/}

                <div>
                  <Label htmlFor="country" className="text-sm font-medium text-slate-900">
                    Country
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="mt-2 border-slate-300">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Canada">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ca"></span> Canada
                        </span>
                      </SelectItem>
                      <SelectItem value="USA">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-us"></span> USA
                        </span>
                      </SelectItem>
                      <SelectItem value="Afghanistan">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-af"></span> Afghanistan
                        </span>
                      </SelectItem>
                      <SelectItem value="Albania">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-al"></span> Albania
                        </span>
                      </SelectItem>
                      <SelectItem value="Algeria">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-dz"></span> Algeria
                        </span>
                      </SelectItem>
                      <SelectItem value="Andorra">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ad"></span> Andorra
                        </span>
                      </SelectItem>
                      <SelectItem value="Angola">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ao"></span> Angola
                        </span>
                      </SelectItem>
                      <SelectItem value="Argentina">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ar"></span> Argentina
                        </span>
                      </SelectItem>
                      <SelectItem value="Armenia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-am"></span> Armenia
                        </span>
                      </SelectItem>
                      <SelectItem value="Australia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-au"></span> Australia
                        </span>
                      </SelectItem>
                      <SelectItem value="Austria">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-at"></span> Austria
                        </span>
                      </SelectItem>
                      <SelectItem value="Azerbaijan">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-az"></span> Azerbaijan
                        </span>
                      </SelectItem>
                      <SelectItem value="Bahamas">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bs"></span> Bahamas
                        </span>
                      </SelectItem>
                      <SelectItem value="Bahrain">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bh"></span> Bahrain
                        </span>
                      </SelectItem>
                      <SelectItem value="Bangladesh">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bd"></span> Bangladesh
                        </span>
                      </SelectItem>
                      <SelectItem value="Barbados">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bb"></span> Barbados
                        </span>
                      </SelectItem>
                      <SelectItem value="Belarus">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-by"></span> Belarus
                        </span>
                      </SelectItem>
                      <SelectItem value="Belgium">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-be"></span> Belgium
                        </span>
                      </SelectItem>
                      <SelectItem value="Belize">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bz"></span> Belize
                        </span>
                      </SelectItem>
                      <SelectItem value="Benin">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bj"></span> Benin
                        </span>
                      </SelectItem>
                      <SelectItem value="Bhutan">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bt"></span> Bhutan
                        </span>
                      </SelectItem>
                      <SelectItem value="Bolivia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bo"></span> Bolivia
                        </span>
                      </SelectItem>
                      <SelectItem value="Bosnia and Herzegovina">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ba"></span> Bosnia and Herzegovina
                        </span>
                      </SelectItem>
                      <SelectItem value="Botswana">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bw"></span> Botswana
                        </span>
                      </SelectItem>
                      <SelectItem value="Brazil">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-br"></span> Brazil
                        </span>
                      </SelectItem>
                      <SelectItem value="Brunei">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bn"></span> Brunei
                        </span>
                      </SelectItem>
                      <SelectItem value="Bulgaria">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bg"></span> Bulgaria
                        </span>
                      </SelectItem>
                      <SelectItem value="Burkina Faso">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bf"></span> Burkina Faso
                        </span>
                      </SelectItem>
                      <SelectItem value="Burundi">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-bi"></span> Burundi
                        </span>
                      </SelectItem>
                      <SelectItem value="Cambodia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-kh"></span> Cambodia
                        </span>
                      </SelectItem>
                      <SelectItem value="Cameroon">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cm"></span> Cameroon
                        </span>
                      </SelectItem>
                      <SelectItem value="Cape Verde">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cv"></span> Cape Verde
                        </span>
                      </SelectItem>
                      <SelectItem value="Central African Republic">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cf"></span> Central African Republic
                        </span>
                      </SelectItem>
                      <SelectItem value="Chad">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-td"></span> Chad
                        </span>
                      </SelectItem>
                      <SelectItem value="Chile">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cl"></span> Chile
                        </span>
                      </SelectItem>
                      <SelectItem value="China">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cn"></span> China
                        </span>
                      </SelectItem>
                      <SelectItem value="Colombia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-co"></span> Colombia
                        </span>
                      </SelectItem>
                      <SelectItem value="Comoros">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-km"></span> Comoros
                        </span>
                      </SelectItem>
                      <SelectItem value="Congo">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cg"></span> Congo
                        </span>
                      </SelectItem>
                      <SelectItem value="Costa Rica">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cr"></span> Costa Rica
                        </span>
                      </SelectItem>
                      <SelectItem value="Croatia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-hr"></span> Croatia
                        </span>
                      </SelectItem>
                      <SelectItem value="Cuba">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cu"></span> Cuba
                        </span>
                      </SelectItem>
                      <SelectItem value="Cyprus">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cy"></span> Cyprus
                        </span>
                      </SelectItem>
                      <SelectItem value="Czech Republic">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-cz"></span> Czech Republic
                        </span>
                      </SelectItem>
                      <SelectItem value="Denmark">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-dk"></span> Denmark
                        </span>
                      </SelectItem>
                      <SelectItem value="Djibouti">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-dj"></span> Djibouti
                        </span>
                      </SelectItem>
                      <SelectItem value="Dominica">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-dm"></span> Dominica
                        </span>
                      </SelectItem>
                      <SelectItem value="Dominican Republic">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-do"></span> Dominican Republic
                        </span>
                      </SelectItem>
                      <SelectItem value="Ecuador">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ec"></span> Ecuador
                        </span>
                      </SelectItem>
                      <SelectItem value="Egypt">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-eg"></span> Egypt
                        </span>
                      </SelectItem>
                      <SelectItem value="El Salvador">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-sv"></span> El Salvador
                        </span>
                      </SelectItem>
                      <SelectItem value="Equatorial Guinea">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gq"></span> Equatorial Guinea
                        </span>
                      </SelectItem>
                      <SelectItem value="Eritrea">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-er"></span> Eritrea
                        </span>
                      </SelectItem>
                      <SelectItem value="Estonia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ee"></span> Estonia
                        </span>
                      </SelectItem>
                      <SelectItem value="Eswatini">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-sz"></span> Eswatini
                        </span>
                      </SelectItem>
                      <SelectItem value="Ethiopia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-et"></span> Ethiopia
                        </span>
                      </SelectItem>
                      <SelectItem value="Fiji">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-fj"></span> Fiji
                        </span>
                      </SelectItem>
                      <SelectItem value="Finland">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-fi"></span> Finland
                        </span>
                      </SelectItem>
                      <SelectItem value="France">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-fr"></span> France
                        </span>
                      </SelectItem>
                      <SelectItem value="Gabon">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ga"></span> Gabon
                        </span>
                      </SelectItem>
                      <SelectItem value="Gambia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gm"></span> Gambia
                        </span>
                      </SelectItem>
                      <SelectItem value="Georgia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ge"></span> Georgia
                        </span>
                      </SelectItem>
                      <SelectItem value="Germany">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-de"></span> Germany
                        </span>
                      </SelectItem>
                      <SelectItem value="Ghana">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gh"></span> Ghana
                        </span>
                      </SelectItem>
                      <SelectItem value="Greece">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gr"></span> Greece
                        </span>
                      </SelectItem>
                      <SelectItem value="Grenada">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gd"></span> Grenada
                        </span>
                      </SelectItem>
                      <SelectItem value="Guatemala">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gt"></span> Guatemala
                        </span>
                      </SelectItem>
                      <SelectItem value="Guinea">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gn"></span> Guinea
                        </span>
                      </SelectItem>
                      <SelectItem value="Guyana">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gy"></span> Guyana
                        </span>
                      </SelectItem>
                      <SelectItem value="Haiti">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ht"></span> Haiti
                        </span>
                      </SelectItem>
                      <SelectItem value="Honduras">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-hn"></span> Honduras
                        </span>
                      </SelectItem>
                      <SelectItem value="Hungary">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-hu"></span> Hungary
                        </span>
                      </SelectItem>
                      <SelectItem value="Iceland">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-is"></span> Iceland
                        </span>
                      </SelectItem>
                      <SelectItem value="India">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-in"></span> India
                        </span>
                      </SelectItem>
                      <SelectItem value="Indonesia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-id"></span> Indonesia
                        </span>
                      </SelectItem>
                      <SelectItem value="Iran">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ir"></span> Iran
                        </span>
                      </SelectItem>
                      <SelectItem value="Iraq">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-iq"></span> Iraq
                        </span>
                      </SelectItem>
                      <SelectItem value="Ireland">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ie"></span> Ireland
                        </span>
                      </SelectItem>
                      <SelectItem value="Israel">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-il"></span> Israel
                        </span>
                      </SelectItem>
                      <SelectItem value="Italy">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-it"></span> Italy
                        </span>
                      </SelectItem>
                      <SelectItem value="Jamaica">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-jm"></span> Jamaica
                        </span>
                      </SelectItem>
                      <SelectItem value="Japan">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-jp"></span> Japan
                        </span>
                      </SelectItem>
                      <SelectItem value="Jordan">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-jo"></span> Jordan
                        </span>
                      </SelectItem>
                      <SelectItem value="Kazakhstan">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-kz"></span> Kazakhstan
                        </span>
                      </SelectItem>
                      <SelectItem value="Kenya">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ke"></span> Kenya
                        </span>
                      </SelectItem>
                      <SelectItem value="Korea, South">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-kr"></span> South Korea
                        </span>
                      </SelectItem>
                      <SelectItem value="Kuwait">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-kw"></span> Kuwait
                        </span>
                      </SelectItem>
                      <SelectItem value="Latvia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-lv"></span> Latvia
                        </span>
                      </SelectItem>
                      <SelectItem value="Lebanon">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-lb"></span> Lebanon
                        </span>
                      </SelectItem>
                      <SelectItem value="Libya">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ly"></span> Libya
                        </span>
                      </SelectItem>
                      <SelectItem value="Lithuania">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-lt"></span> Lithuania
                        </span>
                      </SelectItem>
                      <SelectItem value="Luxembourg">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-lu"></span> Luxembourg
                        </span>
                      </SelectItem>
                      <SelectItem value="Malaysia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-my"></span> Malaysia
                        </span>
                      </SelectItem>
                      <SelectItem value="Maldives">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-mv"></span> Maldives
                        </span>
                      </SelectItem>
                      <SelectItem value="Mexico">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-mx"></span> Mexico
                        </span>
                      </SelectItem>
                      <SelectItem value="Monaco">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-mc"></span> Monaco
                        </span>
                      </SelectItem>
                      <SelectItem value="Morocco">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ma"></span> Morocco
                        </span>
                      </SelectItem>
                      <SelectItem value="Netherlands">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-nl"></span> Netherlands
                        </span>
                      </SelectItem>
                      <SelectItem value="New Zealand">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-nz"></span> New Zealand
                        </span>
                      </SelectItem>
                      <SelectItem value="Nigeria">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ng"></span> Nigeria
                        </span>
                      </SelectItem>
                      <SelectItem value="Norway">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-no"></span> Norway
                        </span>
                      </SelectItem>
                      <SelectItem value="Pakistan">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-pk"></span> Pakistan
                        </span>
                      </SelectItem>
                      <SelectItem value="Peru">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-pe"></span> Peru
                        </span>
                      </SelectItem>
                      <SelectItem value="Philippines">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ph"></span> Philippines
                        </span>
                      </SelectItem>
                      <SelectItem value="Poland">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-pl"></span> Poland
                        </span>
                      </SelectItem>
                      <SelectItem value="Portugal">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-pt"></span> Portugal
                        </span>
                      </SelectItem>
                      <SelectItem value="Qatar">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-qa"></span> Qatar
                        </span>
                      </SelectItem>
                      <SelectItem value="Romania">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ro"></span> Romania
                        </span>
                      </SelectItem>
                      <SelectItem value="Russia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ru"></span> Russia
                        </span>
                      </SelectItem>
                      <SelectItem value="Saudi Arabia">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-sa"></span> Saudi Arabia
                        </span>
                      </SelectItem>
                      <SelectItem value="Singapore">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-sg"></span> Singapore
                        </span>
                      </SelectItem>
                      <SelectItem value="South Africa">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-za"></span> South Africa
                        </span>
                      </SelectItem>
                      <SelectItem value="Spain">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-es"></span> Spain
                        </span>
                      </SelectItem>
                      <SelectItem value="Sweden">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-se"></span> Sweden
                        </span>
                      </SelectItem>
                      <SelectItem value="Switzerland">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ch"></span> Switzerland
                        </span>
                      </SelectItem>
                      <SelectItem value="Thailand">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-th"></span> Thailand
                        </span>
                      </SelectItem>
                      <SelectItem value="Turkey">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-tr"></span> Turkey
                        </span>
                      </SelectItem>
                      <SelectItem value="Ukraine">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ua"></span> Ukraine
                        </span>
                      </SelectItem>
                      <SelectItem value="United Arab Emirates">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-ae"></span> United Arab Emirates
                        </span>
                      </SelectItem>
                      <SelectItem value="United Kingdom">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-gb"></span> United Kingdom
                        </span>
                      </SelectItem>
                      <SelectItem value="Vietnam">
                        <span className="flex items-center gap-2">
                          <span className="fi fi-vn"></span> Vietnam
                        </span>
                      </SelectItem>
                      <SelectItem value="Other">
                        <span className="flex items-center gap-2">
                          Other
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="postal-code" className="text-sm font-medium text-slate-900">
                    Postal / Zip Code
                  </Label>
                  <Input
                    id="postal-code"
                    placeholder="e.g., M8V 1E5"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="mt-2 border-slate-300"
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 ml-1">
                We use your exact location to find nearby landmarks and events for your posts.
              </p>

              {/* Email */}
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
                  required
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

      </main>
    </>
  );
}
