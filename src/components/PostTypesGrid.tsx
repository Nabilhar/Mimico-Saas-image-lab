/**
 * Post Types Overview Grid
 * Compact 6-card grid showing all post types
 * Links to /post-types page for details
 * 
 * INSERT THIS on landing page AFTER the MythbustingFeature component
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LightbulbIcon, 
  EyeIcon, 
  SparklesIcon, 
  MegaphoneIcon, 
  CalendarIcon, 
  HeartIcon 
} from "lucide-react";

export function PostTypesGrid() {
  const postTypes = [
    {
      id: "myth-busting",
      icon: LightbulbIcon,
      name: "Myth-busting",
      description: "Correct common misconceptions using your craft expertise. Education that builds trust.",
      href: "/post-types#myth-busting"
    },
    {
      id: "behind-the-scenes",
      icon: EyeIcon,
      name: "Behind the Scenes",
      description: "Show the hidden work that goes into your craft. Pull back the curtain on technique.",
      href: "/post-types#behind-the-scenes"
    },
    {
      id: "tip-of-the-day",
      icon: SparklesIcon,
      name: "Tip of the Day",
      description: "Share actionable advice customers can use immediately. Practical and specific.",
      href: "/post-types#tip-of-the-day"
    },
    {
      id: "promotion",
      icon: MegaphoneIcon,
      name: "Promotion",
      description: "Announce offers, services, or products. Grounded in local context, not generic ads.",
      href: "/post-types#promotion"
    },
    {
      id: "local-event",
      icon: CalendarIcon,
      name: "Local Event",
      description: "Connect your business to what's happening in your neighborhood. Community-first.",
      href: "/post-types#local-event"
    },
    {
      id: "community-moment",
      icon: HeartIcon,
      name: "Community Moment",
      description: "Celebrate milestones, thank customers, or acknowledge local moments. Human connection.",
      href: "/post-types#community-moment"
    }
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-b">
      <div className="mx-auto max-w-6xl px-6 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            6 Ways to Connect With Your Community
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Each post type helps you show up differently. All grounded in your neighborhood, 
            all written in your voice, all generated in real-time.
          </p>
        </div>

        {/* Grid of 6 Post Types */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {postTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Link 
                key={type.id}
                href={type.href}
                className="group"
              >
                <Card className="h-full border-slate-200 hover:border-cyan-800 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center mb-4 group-hover:bg-cyan-100 transition-colors">
                      <Icon className="w-6 h-6 text-cyan-800" />
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-cyan-800 transition-colors">
                      {type.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {type.description}
                    </p>
                    
                    {/* Learn More Link */}
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-cyan-800 group-hover:gap-2 transition-all">
                      <span>Learn more</span>
                      <span className="text-lg">→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="/post-types"
            className="inline-flex items-center justify-center px-6 py-3 bg-cyan-800 hover:bg-cyan-900 text-white font-medium rounded-md transition-colors"
          >
            Explore All Post Types
          </Link>
        </div>
      </div>
    </section>
  );
}
