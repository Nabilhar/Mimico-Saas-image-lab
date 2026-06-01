/**
 * Post Types Product Page
 * Full details on all 6 post types Shoreline generates
 * URL: /post-types
 */

import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Show, SignUpButton } from "@clerk/nextjs";

export default function PostTypesPage() {
  return (
    <>
      <SiteHeader />
      <main className="w-full">
        {/* Page Header */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-20 border-b">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                5 Post Types, Always Fresh
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                Each post type helps you connect with your community in a different way. 
                All grounded in your neighborhood, all written in your voice, all generated in real-time.
              </p>
              <div className="flex gap-4">
                <a 
                  href="#tip-of-the-day"
                  className="inline-flex items-center justify-center px-6 py-3 bg-cyan-800 hover:bg-cyan-900 text-white font-medium rounded-md transition-colors"
                >
                  Explore Post Types
                </a>
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <button className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md transition-colors">
                      Try with Free Credits
                    </button>
                  </SignUpButton>
                </Show>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Navigation */}
        <nav className="sticky top-[64px] z-30 bg-white border-b border-slate-200 shadow-sm backdrop-blur-sm bg-white/95">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
              {/* <a href="#myth-busting" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-md whitespace-nowrap transition-colors">
                Myth-busting
              </a> */}
              <a href="#tip-of-the-day" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-md whitespace-nowrap transition-colors">
                Today's Tip
              </a>
              <a href="#behind-the-scenes" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-md whitespace-nowrap transition-colors">
                Behind the Curtain
              </a>
              <a href="#community-moment" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-md whitespace-nowrap transition-colors">
                Community Moment
              </a>
              <a href="#promotion" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-md whitespace-nowrap transition-colors">
                Promotion
              </a>
              <a href="#local-event" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-md whitespace-nowrap transition-colors">
                Local Event
              </a>
            </div>
          </div>
        </nav>

                
        {/* ===================================== */}
        {/* MYTH-BUSTING SECTION (Full Detail)   */}
        {/* ===================================== 
        <section id="myth-busting" className="bg-slate-50 py-16 md:py-24 border-b scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">*/}
            {/* Header 
              <div className="mb-12 max-w-3xl">
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full mb-4">
                Post Type #1
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                Myth-busting: Why Shoreline Posts Get Shared
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Education builds trust faster than promotion. Myth-busting posts correct common beliefs in your field—and customers share them because they learned something.
              </p>
            </div> */}

            {/* Two-column layout: Explanation + Example 
            <div className="grid lg:grid-cols-2 gap-12 mb-16"> */}
              {/* Left Column: Explanation 
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    What Makes Myth-busting Different
                  </h3>
                  <div className="text-slate-700 space-y-4">
                    <p>
                      Most AI tools generate generic tips and engagement bait. "5 Ways to Improve Your Morning Routine!" Everyone sounds the same.
                    </p>
                    <p>
                      Shoreline's Myth-busting mode does something no other content tool can: <strong>it corrects misconceptions using your actual expertise.</strong>
                    </p>
                    <p>
                      Instead of generic tips, you get posts that teach something counterintuitive—grounded in your neighborhood, using your craft knowledge.
                    </p>
                  </div>
                </div> */}

                {/* Why This Works 
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Why this works:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Teaches something counterintuitive (not generic advice)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Explains the hidden mechanism (shows real expertise)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Grounds it in your location (your neighborhood)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Sounds like you (craft knowledge, not marketing speak)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Gets shared ("I always thought X, but actually...")
                      </span>
                    </div>
                  </div>
                </div> */}

                {/* Voice Recommendation 
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Voice Recommendation:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Myth-busting works best with <strong>Authoritative & Precise</strong> (for clinical/technical fields)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        <strong>Warm & Conversational</strong> for approachable brands
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-slate-700">
                        For detailed voice comparisons and niche-specific recommendations, see the "Choosing Your Voice" guide.
                      </span>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Right Column: Example Post 
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: The Village Bakery</span>
                </div> */}
                
                {/* Example Post Card 
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      S
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">The Village Bakery</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Mimico Village, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 28s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`People think room temperature butter mixes better into dough. Softer equals easier to work with, so bakers wait for butter to warm before starting.

Here in Mimico Village, we pull butter straight from the fridge for most pastries. Cold butter creates tiny solid pockets that melt during baking—those pockets turn into steam, which is what gives you flaky layers in croissants and danishes. When butter's too warm, it blends completely into the flour. You get dense, cakey texture instead of those crisp, separate sheets that shatter when you bite.

Cold butter is harder to handle, but it's not about ease—it's about structure you can't see until heat hits it.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/Baker-butter.png"
                      alt="Baker cutting cold butter for pastry dough" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Myth-busting mode</span>
                      <span className="font-medium text-cyan-800">#TheVillageBakery #MimicoVillage #BakingScience</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div> */}

            {/* Not Just Bakeries 
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Not Just Bakeries</h3>
              <p className="text-slate-600 mb-8 max-w-3xl">
                Myth-busting works for any business with <strong>teachable craft</strong>. If your customers hold misconceptions about your field, Shoreline turns your expertise into trust-building content.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Physiotherapy</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "People ice injuries immediately to reduce swelling. But that initial rest period masks the movement pattern that caused the injury. Six months later, the shoulder flares up again because nothing changed at the root."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Barbershops</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "People think clipper-only fades are faster and just as good. Wrong. Clipper guards jump in fixed increments. The fade looks choppy because there's no blending layer. Scissor-over-comb fills the gaps—that's what makes it smooth."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Real Estate</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "People wait for interest rates to drop before buying. But delaying your entry means paying a higher premium when sidelined buyers return. The timing window closes before the rate environment improves."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div> */}

            {/* When to Use 
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">When to Use Myth-busting</h3>
              <p className="text-slate-700 leading-relaxed">
                Use Myth-busting when you notice customers making decisions based on incorrect assumptions about your craft. 
                Perfect for correcting widespread beliefs about techniques, timing, materials, or process. 
                Best for businesses where expertise isn't immediately visible to customers—where the "why" behind your work matters as much as the "what."
              </p>
            </div>
          </div>
        </section> */}

        {/* ===================================== */}
        {/* TIP OF THE DAY SECTION (Full Detail) */}
        {/* ===================================== */}
        <section id="tip-of-the-day" className="bg-slate-50 py-16 md:py-24 border-b scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            {/* Header */}
            <div className="mb-12 max-w-3xl">
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full mb-4">
                Post Type #1
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                Today's Tip: Teaching Without Selling
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Share one specific, actionable technique your customers can use immediately. Not vague advice—practical instruction grounded in your craft.
              </p>
            </div>

            {/* Two-column layout: Explanation + Example */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left Column: Explanation */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    What Makes Tips Work
                  </h3>
                  <div className="text-slate-700 space-y-4">
                    <p>
                      Most social media tips are generic platitudes. "Stay hydrated!" "Listen to your body!" Everyone says the same thing.
                    </p>
                    <p>
                      Shoreline Today's Tip mode teaches <strong>specific techniques from your actual practice</strong>—the micro-adjustments, timing windows, and observable cues that separate good results from great ones.
                    </p>
                    <p>
                      Each tip follows a tight structure: state the action → show what happens → done. No motivation, no life coaching. Just the technique.
                    </p>
                  </div>
                </div>

                {/* Why This Works */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Why this works:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Immediately actionable (readers can try it today)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Observable results (they can see/feel if it works)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Shows the mechanism (explains what actually happens)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Specific to your craft (couldn't apply to any business)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Builds expertise quietly (teaches without selling)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voice Recommendation */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Voice Recommendation:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Tips work best with <strong>Warm & Conversational</strong> (friendly instruction, like showing someone a technique)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Use <strong>Authoritative & Precise</strong> for clinical/technical fields (health, trades, professional services)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-slate-700">
                        Tips are about teaching practical techniques—warmth makes instruction approachable, precision makes it trustworthy.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Example Post */}
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Lawrence Physiotherapy</span>
                </div>
                
                {/* Example Post Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      T
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Lawrence Physiotherapy</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Lawrence Park, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 22s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`When you return to movement after time off, start with half the range of motion you think you need.

Your nervous system reads full range as permission to load it immediately. By moving through 50% of what feels available, you're signaling "this is safe," which lets your tissues adapt without triggering protective tightness. Do this for 3-4 days before expanding.

At our clinic, we see this pattern every spring as patients resume outdoor activity after winter. You'll feel less stiff, not more.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/Physio-movement-range.png"
                      alt="Progressive movement range demonstration" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Tip of the Day mode</span>
                      <span className="font-medium text-cyan-800">#PhysiotherapyTip #LawrencePark #MovementTip</span>
                    </div>
                  </div>
                </Card>

                {/* Second Example */}
                <div className="mt-6 mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Riverside Shawarma</span>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      Q
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Riverside Shawarma</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Riverside, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 24s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`When you're threading shish tawook onto the skewer, grab chicken breasts that are all the same size and thickness. Uniform pieces cook at the same rate—the thin edge and thick end both hit that golden char at the exact same moment. Uneven breasts mean you're either pulling thin pieces off early or waiting for thick ones to catch up, and by then the thin ones are dry.

We size-match at the counter before they go on the flame. Takes a minute, saves the whole plate.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/chicken-same-size.png"
                      alt="Chicken same size cooked" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Tip of the Day mode</span>
                      <span className="font-medium text-cyan-800">#ShawarmaLife #Riverside #ShishTawook</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Not Just These Fields */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Works Across Industries</h3>
              <p className="text-slate-600 mb-8 max-w-3xl">
                Tips work for any business where <strong>technique matters</strong>. If there's a better way to do something—a timing window, a micro-adjustment, an observable cue—Shoreline turns it into teachable content.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Bakeries</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "When scoring sourdough, hold your blade at 30 degrees, not vertical. The shallow angle creates an ear that lifts during baking. Vertical cuts seal flat. The difference is in the angle before the oven, not what happens inside it."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Personal Training</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "Before increasing weight, check your bar speed on the concentric phase. If the bar slows in the middle third of the lift, you're not ready. Speed consistency across the full range means your nervous system can handle more load."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">HVAC</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "When checking refrigerant charge, measure superheat at the evaporator coil, not just at the compressor. A 5-degree difference between the two points means you have a restriction in the line. The compressor reading alone won't show it."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* When to Use */}
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">When to Use Tips</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Use Tips to show a technique, timing window, or observable cue that most people miss. Perfect for teaching the micro-adjustments that separate good results from great ones.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Tips work best for businesses where <strong>how you do something</strong> matters as much as what you do—where small adjustments create measurable differences. If you find yourself saying "here's the trick" or "most people don't notice this," that's a tip.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* BEHIND THE SCENES SECTION (Full Detail) */}
        {/* ===================================== */}
        <section id="behind-the-scenes" className="bg-white py-16 md:py-24 border-b scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            {/* Header */}
            <div className="mb-12 max-w-3xl">
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full mb-4">
                Post Type #2
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                Behind the Curtain: The Work Nobody Sees
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Show a specific moment happening inside your work that customers rarely witness. Not explaining why it matters—just capturing what's happening right now.
              </p>
            </div>

            {/* Two-column layout: Explanation + Example */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left Column: Explanation */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    What Makes Behind the Curtain Different
                  </h3>
                  <div className="text-slate-700 space-y-4">
                    <p>
                      Most "behind the scenes" content is staged or summarized after the fact. "Here's how we make X!" with finished-product photos.
                    </p>
                    <p>
                      Shoreline's Behind the Scenes mode captures <strong>one operational moment happening right now</strong>—present tense, mid-work, showing what you're checking, adjusting, or noticing that customers never see.
                    </p>
                    <p>
                      No teaching. No explaining why it matters. Just the observation itself—like you paused for 20 seconds to type what's happening.
                    </p>
                  </div>
                </div>

                {/* Why This Works */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Why this works:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Present tense creates presence (readers are there with you)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Shows unseen work (not finished products)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Operational details (temperature checks, timing windows, adjustments)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        No "why it matters" (the work speaks for itself)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Builds trust quietly (you're not marketing, just working)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voice Recommendation */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Voice Recommendation:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Behind the Scenes works best with <strong>Warm & Conversational</strong> (creates human presence—readers feel like they're working alongside you)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Use <strong>Clean & Understated</strong> for high-end brands (sophistication elevates craft without warmth)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-slate-700">
                        Behind the Scenes is about showing unseen work—warmth makes it feel authentic, restraint makes it feel premium.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Example Posts */}
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: North York YOGA Studio</span>
                </div>
                
                {/* Example Post Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      C
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">TYB YOGA Studio</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">North York, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 26s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`The mirror's edge catches fingerprints from this morning's class. I'm moving along the length of it with a microfiber cloth, watching the light shift across the surface as I go—pushing out smudges, checking the angle of reflection against the floor line where people will stand. The studio's bright and clear right now, quiet before bodies come back in.

I step back. The reflection needs to be true. When someone's holding a pose, grounding into their foundation, the mirror shows them exactly what's happening—spine stacked, shoulders settled, weight distributed. A smudged surface steals that feedback. So I keep moving, cloth in steady passes, until the glass gives back a clean line again. Ready. 🧘‍♀️✨`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/yoga-clean-mirrors.png"
                      alt="Yoga clean mirrors" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Behind the Scenes mode</span>
                      <span className="font-medium text-cyan-800">#TherapyStudio #StudioCraft #FlowPrep</span>
                    </div>
                  </div>
                </Card>

                {/* Second Example */}
                <div className="mt-6 mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Glow Skin Medical</span>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      G
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Glow Skin Medical</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Yorkville, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 24s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`We keep our HydraFacial serums stored upright in a cool, dark cabinet away from direct light. When these vials stay vertical, the concentrated actives—peptides, hyaluronic acid, antioxidants—remain stable and settle properly. 

Horizontal storage or exposure to heat and light degrades them faster, so you're applying weakened formulas that won't deliver the results the treatment promises.

Store upright. Keep it dark and cool. The serum performs exactly as designed.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/serum-upright-applied.png"
                      alt="Serum applied on skin" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Behind the Scenes mode</span>
                      <span className="font-medium text-cyan-800">#MedicalAesthetics #Yorkville #SkinCare</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Not Just These Fields */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Works Across Industries</h3>
              <p className="text-slate-600 mb-8 max-w-3xl">
                Behind the Scenes works for any business where <strong>the work happens before customers see the result</strong>. Prep work, quality checks, mid-process adjustments—moments that show craft without explaining it.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Coffee Roasting</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "7:15 AM. The Ethiopian beans hit first crack at 396°F. I'm watching the roast development through the sight glass—color's shifting from cinnamon to milk chocolate. Twenty seconds until I drop them. The window between bright acidity and flat bitterness is about forty-five seconds. I can hear the second crack starting."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Auto Repair</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "The Honda Civic's on the lift. I'm checking the brake fluid reservoir—it's dark, almost black. Should be amber. This tells me the system's been overheating. I drop down, pull the rear wheel. The caliper piston's seized. Not just worn pads—the whole assembly needs replacing. The quote just changed."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Flower Shop</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "5:30 AM. The peonies arrived from the wholesaler still closed tight. I'm checking stem firmness—if they're too soft, they won't open properly. These are good. I recut each stem at a 45-degree angle underwater, strip the lower leaves. Into the cooler at 2°C. By noon, they'll be ready for arrangements."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* When to Use */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">When to Use Behind the Curtain</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Use Behind the Curtain when you want to show the work that happens before customers see the result. Perfect for prep work, quality checks, mid-process decisions, and operational moments that reveal craft without explaining it.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Behind the Curtain works best for businesses where <strong>invisible work matters</strong>—where the quality of what customers receive depends on decisions and adjustments they never witness. If your work has a "before the doors open" or "between orders" phase, that's Behind the Scenes territory.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* COMMUNITY MOMENT SECTION (Full Detail) */}
        {/* ===================================== */}
        <section id="community-moment" className="bg-slate-50 py-16 md:py-24 border-b scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            {/* Header */}
            <div className="mb-12 max-w-3xl">
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full mb-4">
                Post Type #3
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                Community Moment: The Patterns Your Regulars Leave Behind
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Describe a recurring pattern you've noticed in your space—what customers do, where they settle, how they use specific spots in the room. Not atmosphere. Not feelings. The specific behavior that keeps happening.
              </p>
            </div>

            {/* Two-column layout: Explanation + Example */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left Column: Explanation */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    What Makes Community Moment Different
                  </h3>
                  <div className="text-slate-700 space-y-4">
                    <p>
                      Most "community" posts tell you how it feels. "Love our regulars!" "Such good energy in here today!" Mood statements that could apply to any business anywhere.
                    </p>
                    <p>
                      Shoreline's Community Moment mode captures <strong>a specific recurring pattern</strong>—what a particular customer always does, where a group consistently settles, what keeps happening at a specific spot in your room. Actions, positions, small gestures. The belonging comes through in the behavior, not the words.
                    </p>
                    <p>
                      No interpreting emotions. No naming the atmosphere. Just the pattern itself—described the way someone who's watched it happen a hundred times would describe it.
                    </p>
                  </div>
                </div>

                {/* Why This Works */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Why this works:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Anchored in a specific spot (the corner table, the window chairs, the waiting bench)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Describes actions, not feelings (what they do, not how they feel about it)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Recurring pattern language ("always", "every Tuesday", "by 3 PM someone")
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        No interpretation (readers draw their own conclusions)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Recognizable to other business owners (they'll nod at their own version of it)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voice Recommendation */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Voice Recommendation:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Community Moment works best with <strong>Warm & Conversational</strong> (creates the feel of an owner who knows their regulars—observant, not performing)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Use <strong>Clean & Understated</strong> for high-end brands (restraint matches the observation—no commentary, just the pattern)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-slate-700">
                        The goal is to sound like someone who pays attention to their space—not someone narrating it for an audience.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Example Posts */}
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Junction Coffee</span>
                </div>
                
                {/* Example Post Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      J
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Junction Coffee</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">The Junction, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 20s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`7:30 AM. The door opens and cold air rushes across the floor tiles. A woman unwraps her scarf at the counter, her glasses fogging white. The espresso machine hisses, releasing steam that spreads across the front window where frost patterns still cling to the corners.

Outside, grey-blue light sits flat on Dundas Street. Inside, the halogen pendants cast yellow circles on the bar top.

Someone's gloves drip onto the reclaimed wood table. The grinder starts its sharp whirr. A regular stamps snow off his boots—three quick thumps on the mat—then pulls the door closed behind him, muffling the street.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/coffee-shop-frosted.jpeg"
                      alt="Morning coffee shop with frosted windows" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Community Moment mode</span>
                      <span className="font-medium text-cyan-800">#JunctionCoffee #TorontoMorning #TheJunction</span>
                    </div>
                  </div>
                </Card>

                {/* Second Example */}
                <div className="mt-6 mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Yorkville Beauty Center</span>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      R
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Yorkville Beauty Center</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Yorkville, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 22s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`By 3 o'clock on Thursdays, the two armchairs by the windows shift. Shopping bags settle on the light wood floor, designer handles catching the afternoon light. Same pattern every week—someone sits, sets their phone face-down on the side table, and doesn't touch it for twenty minutes. 

Sometimes two people claim both chairs at once, bags lined up like checkpoints between them. They're not waiting. They're stopping. There's something about that stretch of window view and the quiet that makes people pause mid-afternoon, mid-errand, and just sit.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/bags-view-chairs.png"
                      alt="Sitting on chairs with shopping bags" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Community Moment mode</span>
                      <span className="font-medium text-cyan-800">#TorontoAesthetics #SpaceObservations #MedicalSpa</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Works Across Industries */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Works Across Industries</h3>
              <p className="text-slate-600 mb-8 max-w-3xl">
                Community Moment works for any business with regulars—where <strong>people develop habits around your space</strong>. Coffee shops, salons, studios, bookstores, taprooms—places where customers return often enough that you start to notice their patterns.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Bookstore</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "The armchair by the poetry shelf fills up by noon on Saturdays. Same rotation—someone reads for an hour, leaves, another person takes it within ten minutes. Nobody coordinates this. By 2 PM the seat's been through four or five people and nobody's spoken to each other once."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Hair Salon</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "Every Friday a regular comes in, sits in the same chair, and catches up with whoever's next to her—even if she's never met them. By the time her color's setting she knows where they work, what they're doing that weekend. The dryer goes on and she keeps talking through it."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Brewery Taproom</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "Thursday evenings the same four people take the end of the long table. They don't reserve it—they just show up and it's open. Been happening for months. One of them always brings a board game that never gets opened. It stays in the bag the whole time."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* When to Use */}
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">When to Use Community Moment</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Use Community Moment when you want to show something your customers consistently do—not a one-off, but a pattern that keeps repeating. A regular who always takes the same seat. A group that claims the same table every week. The way people use a specific part of your space that you never designed for that purpose.
              </p>
              <p className="text-slate-700 leading-relaxed">
                If you find yourself thinking "it's funny, every time..." or "there's always someone who..."—that's Community Moment territory. The post writes itself once you've named the pattern.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* PROMOTION / OFFER SECTION (Full Detail) */}
        {/* ===================================== */}
        <section id="promotion" className="bg-white py-16 md:py-24 border-b scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            {/* Header */}
            <div className="mb-12 max-w-3xl">
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full mb-4">
                Post Type #4
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                Promotion: Soft-Sell Invitations
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Show work happening right now, then mention what's available. No hype, no urgency tactics—just observation connected to offer.
              </p>
            </div>

            {/* Two-column layout: Explanation + Example */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left Column: Explanation */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    What Makes Promotions Work Without Feeling Pushy
                  </h3>
                  <div className="text-slate-700 space-y-4">
                    <p>
                      Most promotional posts sound like sales pitches. "AMAZING DEAL!" "Limited time only!" "You'd be crazy to pass this up!"
                    </p>
                    <p>
                      Shoreline's Promotion mode uses a two-part structure: <strong>(1) observe work happening right now that relates to the offer, (2) state what's available factually.</strong> The connection is logistical, not philosophical—"this work is what's being offered" rather than "this work shows why the offer is valuable."
                    </p>
                    <p>
                      No building up to a pitch. No inspirational framing. Just: this is happening, this is what's available.
                    </p>
                  </div>
                </div>

                {/* Why This Works */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Why this works:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Logistical connection (kitchen already running during quiet window = special available then)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Factual offer details (what's included, when, how to access)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        No hype language (no "amazing," "don't miss out," "limited time")
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Ends with availability (not with "why it matters")
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Feels like a suggestion, not a sales pitch
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voice Recommendation */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Voice Recommendation:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Promotion works best with <strong>Warm & Conversational</strong> (creates invitation without pressure—warmth makes offers feel like suggestions)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Use <strong>Bold & Direct</strong> for genuinely urgent offers (flash sales, limited seats, time-sensitive deals where scarcity is real)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-slate-700">
                        Promotions need invitation, not pressure. Warmth keeps value framing factual while staying approachable.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Example Posts */}
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Junction Coffee</span>
                </div>
                
                {/* Example Post Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      J
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Junction Coffee</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">The Junction, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 18s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`Right now it's 2:30 on a Wednesday and the shop is humming quietly. Our barista just pulled a beautiful shot, and there are fresh lemon scones cooling on the rack from this morning's bake. Everything's ready to go—we're just not slammed like we are at 8 AM or after school pickup.

So we're running a weekday special from 2-4 PM: any pastry plus any drink for $8. That's the same butter croissant and cappuccino that would normally run you $11.

Kitchen's hot, espresso machine's dialed in, and we've got the space to actually chat while we make your order. Swing by if your afternoon needs a reset.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <span className="text-sm">AI-generated image: Afternoon coffee and pastries</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Promotion mode</span>
                      <span className="font-medium text-cyan-800">#JunctionCoffee #AfternoonSpecial #TheJunction</span>
                    </div>
                  </div>
                </Card>

                {/* Second Example */}
                <div className="mt-6 mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Paramount Shawarma</span>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      P
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Annex Shawarma</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">The Annex, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 20s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`Thursday afternoons, we see the same thing: people swing by between work and whatever's next, looking for something solid that doesn't demand much thought or budget.

We're running the Thursday Special every week, 11:45 a.m. through 9:59 p.m. Chicken shawarma wrap, fries, and a pop—$12.99. That's it. No complications, no upselling.

Stop by this Thursday, we are on Dundas St.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/promotion-shawarma-combo.png"
                      alt="Thursday Special shawarma wrap and fries" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Promotion mode</span>
                      <span className="font-medium text-cyan-800">#TheAnnex #ThursdaySpecial #ShawarmaWrap</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Works Across Industries */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Works Across Industries</h3>
              <p className="text-slate-600 mb-8 max-w-3xl">
                Promotion works for any business with offers, specials, or packages to share. The key is <strong>connecting observed work to availability</strong>—not selling, just mentioning what's there.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Barbershop</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "Tuesday and Wednesday mornings have been quiet lately—chair's open, tools are ready, but we're not booking solid until after lunch. So we're running a mid-week special: full service (cut + hot towel shave) for $55, normally $65. Those morning slots, 9 AM to noon."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Yoga Studio</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "Our 6 AM classes have space right now—usually packed in January, but March mornings are quieter. The room's heated, instructor's there, everything's ready. We're offering a 5-class intro pack for $60 (normally $85) for morning slots only. Good way to test the early schedule."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Auto Repair</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "Winter's ending, which means we're switching from snow tire removals to spring maintenance checks. Oil change + brake inspection + fluid top-up for $89 (normally $110) through April. The bay's ready, parts are in stock. Book any weekday before noon."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* When to Use */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">When to Use Promotion</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Use Promotion when you have an offer, special, or package to share—but you want it to feel like a mention, not a sales pitch. Perfect for slow time windows, seasonal specials, intro packages, or bundled services.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Promotion works best when there's a <strong>logical connection between the work and the offer</strong>—the kitchen's running during the quiet window, so that's when the special runs. The timing makes operational sense, not just marketing sense.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* LOCAL EVENT / NEWS SECTION (Full Detail) */}
        {/* ===================================== */}
        <section id="local-event" className="bg-slate-50 py-16 md:py-24 border-b scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-6">
            {/* Header */}
            <div className="mb-12 max-w-3xl">
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full mb-4">
                Post Type #5
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                Local Event: Neighbourly Mentions
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Notice a pattern at your business, then casually mention a related local event. No hype, no community preaching—just neighborly conversation.
              </p>
            </div>

            {/* Two-column layout: Explanation + Example */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left Column: Explanation */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    What Makes Local Event Posts Work
                  </h3>
                  <div className="text-slate-700 space-y-4">
                    <p>
                      Most businesses either ignore local events or over-hype them. "Support your community!" "Don't miss this incredible gathering!"
                    </p>
                    <p>
                      Shoreline's Local Event mode is <strong>casual and conversational</strong>—like mentioning something to a regular customer. Two-part structure: (1) notice a pattern at your business, (2) mention the related event. The connection is associative (timing or topic), not philosophical.
                    </p>
                    <p>
                      No building up to the event. No explaining why it matters. Just: this is happening here, this is happening nearby.
                    </p>
                    <p className="text-sm bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-slate-600">
                      <strong>How it works:</strong> You tell Shoreline what's happening—a market, a festival, a shoutout to a neighboring business—and it writes the post around it. The AI handles the voice and observation; you supply the local detail it can't discover on its own.
                    </p>
                  </div>
                </div>

                {/* Why This Works */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Why this works:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Neighborly tone (like chatting with someone you know)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Associative connection (timing or topic links observation to event)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        No community preaching (no "support local" messaging)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Low-pressure suggestion (or no CTA at all)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Community energy (business is part of the neighborhood)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voice Recommendation */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Voice Recommendation:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Local Event works best with <strong>Warm & Conversational</strong> (creates neighborly connection—casual mention feels natural and community-connected)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        Use <strong>Bold & Direct</strong> for genuinely exciting events (major festivals, competitions, once-yearly happenings where high energy is authentic)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-slate-700">
                        Local Event is about being part of the neighborhood—warmth creates that casual, friendly connection.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Example Posts */}
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Junction Pizza</span>
                </div>
                
                {/* Example Post Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      J
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Junction Pizza</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">The Junction, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 16s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`Been noticing way more folks asking if we've got outdoor seating ready – there's definitely that nice-weather energy buzzing around the neighborhood right now. We're getting there with the patio setup!

Speaking of which, the West End Farmers Market kicks off this Saturday at Campbell Park (8 AM-2 PM, runs through October). Perfect timing if you're in that spring mood and craving some fresh local stuff.

Might swing by ourselves for some produce.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <img 
                      src="/pizza-patio.png"
                      alt="Pizza in patio" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Local Event mode</span>
                      <span className="font-medium text-cyan-800">#JunctionPizza #WestEndMarket #TheJunction</span>
                    </div>
                  </div>
                </Card>

                {/* Second Example */}
                <div className="mt-6 mb-3">
                  <span className="text-sm font-medium text-slate-500">Example: Chinatown Ramen</span>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3 bg-white">
                    <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      C
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-sm leading-tight">Chinatown Ramen</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate">Chinatown, Toronto</span>
                        <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                          Generated in 18s
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`Fridays have been picking up. More groups coming in after 7 PM, asking if we're open late. The energy shifts—people aren't rushing through lunch, they're settling in for the evening. Tables fill slower but stay longer.

The Chinatown Night Market starts this Friday on Spadina, runs through September. Food stalls, vendors, live music along the street. We're open regular hours—kitchen runs until 10 PM if you want to stop by before or after.

Worth a walk if you're around.`}
                    </p>
                  </CardContent>

                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <span className="text-sm">AI-generated image: Evening street festival with food vendors</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>5 credits • Local Event mode</span>
                      <span className="font-medium text-cyan-800">#ChinatownRamen #NightMarket #Chinatown</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Works Across Industries */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Works Across Industries</h3>
              <p className="text-slate-600 mb-8 max-w-3xl">
                Local Event works for any business that's <strong>part of a neighborhood</strong>—where mentioning local happenings feels natural. Coffee shops, salons, bookstores, gyms—places where customers are locals, not just passers-by.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Bookstore</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "We've been getting more questions about local authors lately—people browsing the Toronto fiction section, asking for recommendations. Word on the Street book festival is this Sunday at Queen's Park. Free all day, hundreds of publishers and authors. Worth checking out if you're looking for something new to read."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Yoga Studio</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "More people asking about outdoor classes this week—spring energy is real. The Beaches Jazz Festival kicks off this weekend along Queen East. Live music every evening, runs for three weeks. Good excuse to get outside after class. We're staying open regular hours if you want to practice before heading over."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Hair Salon</h4>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "Everyone's booking for next Saturday—weddings, parties, something's happening. Turns out it's the Distillery District Spring Market opening weekend. Lots of people heading there after appointments. We've got a few Friday slots still open if you want to get your hair done before the weekend rush."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* When to Use */}
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">When to Use Local Event</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Use Local Event when there's something happening in your neighborhood. Perfect shoutout for street festivals, farmers markets, community gatherings, cultural events—anything where your customers might be interested.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Local Event works best when there's a <strong>natural association</strong>—people asking about outdoor seating + patio season starting, more groups on Fridays + Friday night market, spring energy + summer festival.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 sm:px-6 text-center">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">
              Try All 5 Post Types with Free Credits
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Sign up to get 25 free credits to explore every post type. And join the waitlist to lock your 50% off for 6 months
              No credit card required.
            </p>
            <div className="flex gap-2 items-center justify-center">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center justify-center px-4 py-2 bg-cyan-800 hover:bg-cyan-900 text-white font-semibold rounded-md transition-colors text-m">
                    Get Started
                  </button>
                </SignUpButton>
              </Show>
              <a 
                href="/#cta"
                className="inline-flex items-center justify-center px-4 py-2 bg-cyan-800 hover:bg-cyan-900 text-white font-semibold rounded-md transition-colors text-m"
              >
                Join Waitlist
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-4">
                First 50 to join the waitlist get 50% off for 6 months
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
