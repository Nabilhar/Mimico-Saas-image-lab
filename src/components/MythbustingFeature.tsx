/**
 * Myth-busting Feature Section
 * Showcases Shoreline's flagship post type with real examples
 * Drop this into the landing page between GallerySection and FeaturesSection
 */

import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MythbustingFeature() {
  return (
    <section className="bg-slate-50 py-16 md:py-24 border-b">
      <div className="mx-auto max-w-6xl px-6 sm:px-6">
        {/* Header */}
        <div className="mb-12 max-w-3xl">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Why Shoreline Posts Get Shared
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Education builds trust faster than promotion. Myth-busting posts correct common beliefs in your field—and customers share them because they learned something.
          </p>
        </div>

        {/* Two-column layout: Explanation + Example */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column: Explanation */}
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
            </div>

            {/* Why This Works */}
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
                    Grounds it in your location (Mimico, your neighborhood)
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
            </div>

              {/* Why This Works */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Voice Recommendation:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Myth-busting works best with Authoritative & Precise (for clinical/technical fields)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-800 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Warm & Conversational for approachable brands.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm text-slate-700">
                    For detailed voice comparisons and niche-specific recommendations, see the "Choosing Your Voice" guide.
                  </span>
                </div>

              </div>
            </div>
          </div>

          

          {/* Right Column: Example Post */}
          <div>
            <div className="mb-3">
              <span className="text-sm font-medium text-slate-500">Example: The Village Bakery</span>
            </div>
            
            {/* Example Post Card - Facebook Style */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              {/* Post Header */}
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

              {/* Post Content */}
              <CardContent className="px-4 pb-3 pt-0">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
{`People think room temperature butter mixes better into dough. Softer equals easier to work with, so bakers wait for butter to warm before starting.

Here in Mimico Village, we pull butter straight from the fridge for most pastries. Cold butter creates tiny solid pockets that melt during baking—those pockets turn into steam, which is what gives you flaky layers in croissants and danishes. When butter's too warm, it blends completely into the flour. You get dense, cakey texture instead of those crisp, separate sheets that shatter when you bite.

Cold butter is harder to handle, but it's not about ease—it's about structure you can't see until heat hits it.`}
                </p>
              </CardContent>

              {/* Post Image */}
              <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                <img 
                  src="/Baker-butter.png"  // or whatever your image path is
                  alt="Cold butter creating flaky pastry layers" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Post Footer */}
              <div className="px-4 py-3 bg-white border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>5 credits • Myth-busting mode</span>
                  <span className="font-medium text-cyan-800">#TheVillageBakery #MimicoVillage #BakingScience</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Not Just Bakeries Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-slate-900">Not Just Bakeries</h3>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Myth-busting works for any business with <strong>teachable craft</strong>. If your customers hold misconceptions about your field, Shoreline turns your expertise into trust-building content.
          </p>

          {/* Industry Examples Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Physiotherapy Example */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Physiotherapy</h4>
                <p className="text-sm text-slate-600 italic leading-relaxed">
                  "People ice injuries immediately to reduce swelling. But that initial rest period masks the movement pattern that caused the injury. Six months later, the shoulder flares up again because nothing changed at the root."
                </p>
              </CardContent>
            </Card>

            {/* Barbershop Example */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Barbershops</h4>
                <p className="text-sm text-slate-600 italic leading-relaxed">
                  "People think clipper-only fades are faster and just as good. Wrong. Clipper guards jump in fixed increments. The fade looks choppy because there's no blending layer. Scissor-over-comb fills the gaps—that's what makes it smooth."
                </p>
              </CardContent>
            </Card>

            {/* Real Estate Example */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Real Estate</h4>
                <p className="text-sm text-slate-600 italic leading-relaxed">
                  "People wait for interest rates to drop before buying. But delaying your entry means paying a higher premium when sidelined buyers return. The timing window closes before the rate environment improves."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Why This Matters for Your Business</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional Social Media */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <h4 className="font-semibold text-slate-700">Traditional Social Media</h4>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Generic tips anyone can write</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Feels like marketing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Low shareability (seen it before)</span>
                </li>
              </ul>
            </div>

            {/* Shoreline Myth-busting */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-cyan-800"></div>
                <h4 className="font-semibold text-slate-900">Shoreline Myth-busting</h4>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-800 flex-shrink-0 mt-0.5" />
                  <span>Corrects beliefs using your craft knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-800 flex-shrink-0 mt-0.5" />
                  <span>Feels like education</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-800 flex-shrink-0 mt-0.5" />
                  <span>High shareability (teaches something new)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>The result:</strong> Customers understand what they're paying for. They see the <strong>technique</strong> (scissor-over-comb blending), the <strong>tradeoff</strong> (selection vs. convenience), the <strong>hidden mechanism</strong> (butter pockets → steam). They trust you more because you taught them something—without selling anything.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-6">
            Myth-busting is one of 6 post types. Each one helps you connect with your community in a different way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/post-types"
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-800 hover:bg-cyan-900 text-white font-medium rounded-md transition-colors"
            >
              See All 6 Post Types
            </a>
            <a 
              href="#cta"
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md transition-colors"
            >
              Join the Waitlist
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
