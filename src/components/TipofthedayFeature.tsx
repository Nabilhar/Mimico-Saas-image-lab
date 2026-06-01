/**
 * Myth-busting Feature Section
 * Showcases Shoreline's flagship post type with real examples
 * Drop this into the landing page between GallerySection and FeaturesSection
 */

import { Show, SignUpButton } from "@clerk/nextjs";
import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function TipofthedayFeature() {
  return (
    <section className="bg-slate-50 py-16 md:py-24 border-b">
      <div className="mx-auto max-w-6xl px-6 sm:px-6">
        {/* Header */}
        <div className="mb-12 max-w-3xl">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Why Shoreline Posts Get Shared
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Education builds trust faster than promotion. Today's Tip shares one specific, actionable technique your customers can use immediately. Not vague advice—practical instruction grounded in your craft—and customers share them because they learned something.
          </p>
        </div>

        {/* Two-column layout: Explanation + Example */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column: Explanation */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                What Makes Today's Tip Different
              </h3>
              <div className="text-slate-700 space-y-4">
                <p>
                  Most AI tools generate generic tips and engagement bait. "5 Ways to Improve Your Morning Routine!" Everyone sounds the same.
                </p>
                <p>
                  Shoreline's Today's Tip mode does something no other content tool can: <strong>it teaches specific techniques from your actual practice.</strong>
                </p>
                <p>
                  Instead of generic tips, you get posts that teach something genuinely useful—grounded in your craft knowledge.
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
              <span className="text-sm font-medium text-slate-500">Example: Riverside Barbershop</span>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center gap-3 bg-white">
                <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  Q
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-slate-900 text-sm leading-tight">Riverside Barbershop</span>
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
{`When blending between clipper guards, place your longer guard flat against the scalp, then tilt it 45 degrees at the line where you want the transition to begin.

The tilted guard removes less hair at that boundary, preventing the hard line that occurs when guards meet skin at full contact. This creates a natural diffusion zone.

At Riverside, we use this before scissor-over-comb work—it establishes a soft gradient that your scissors can refine. Your fade guide appears without the client seeing distinct clipper steps.`}
                </p>
              </CardContent>

              <div className="w-full aspect-square bg-slate-100 border-y border-slate-100">
                <img 
                  src="/Barber-clipper-angle.jpeg"
                  alt="Clipper guard angle demonstration" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="px-4 py-3 bg-white border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>5 credits • Tip of the Day mode</span>
                  <span className="font-medium text-cyan-800">#BarbershopTip #Riverside #FadeTechnique</span>
                </div>
              </div>
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
                <h4 className="font-semibold text-slate-900">Shoreline Today's Tip</h4>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-800 flex-shrink-0 mt-0.5" />
                  <span>Actionable tips using your craft knowledge</span>
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
            Today's Tip is one of 5 post types. Each one helps you connect with your community in a different way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/post-types"
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-800 hover:bg-cyan-900 text-white font-medium rounded-md transition-colors"
            >
              See All 5 Post Types
            </a>
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="inline-flex items-center justify-center px-6 py-3 bg-cyan-800 hover:bg-cyan-900 text-white font-medium rounded-md transition-colors">
                  Try with Free Credits
                </button>
              </SignUpButton>
            </Show>
          </div>
        </div>
      </div>
    </section>
  );
}
