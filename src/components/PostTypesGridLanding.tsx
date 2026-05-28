import { Lightbulb, Eye, Sparkles, Megaphone, Calendar, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PostTypesGridLanding() {
  const postTypes = [
    {
      id: 'tip-of-the-day',
      icon: Lightbulb,
      name: 'Tip of the Day',
      description: 'Share specific, actionable techniques customers can use immediately.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'hover:border-purple-200'
    },
    {
      id: 'behind-the-scenes',
      icon: Eye,
      name: 'Behind the Scenes',
      description: 'Show the unseen work happening right now—present-tense, operational moments.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'hover:border-blue-200'
    },
    {
      id: 'community-moment',
      icon: Heart,
      name: 'Community Moment',
      description: 'Pure sensory snapshots creating atmosphere through concrete details.',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'hover:border-pink-200'
    },
    {
      id: 'promotion',
      icon: Megaphone,
      name: 'Promotion / Offer',
      description: 'Soft-sell invitations connecting observed work to what is available.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'hover:border-green-200'
    },
    {
      id: 'local-event',
      icon: Calendar,
      name: 'Local Event',
      description: 'Casual mentions of neighborhood happenings connected to your business.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'hover:border-orange-200'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Five Post Types for Every Business Need
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Shoreline generates content across five distinct modes—each designed for a specific purpose, all grounded in your actual work.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {postTypes.map((type) => {
            const Icon = type.icon;
            return (
              <a
                key={type.id}
                href={`/post-types#${type.id}`}
                className="group"
              >
                <Card className={`border-slate-200 transition-all duration-200 ${type.borderColor} hover:shadow-md h-full`}>
                  <CardContent className="p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${type.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${type.color}`} />
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-cyan-800 transition-colors">
                      {type.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {type.description}
                    </p>

                    {/* Learn More Arrow */}
                    <div className="mt-4 flex items-center text-sm font-medium text-cyan-800 group-hover:translate-x-1 transition-transform">
                      Learn more
                      <svg 
                        className="ml-1 w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <a 
            href="/post-types" 
            className="inline-flex items-center justify-center px-6 py-3 bg-cyan-800 text-white font-semibold rounded-lg hover:bg-cyan-900 transition-colors"
          >
            Explore All Post Types in Detail
            <svg 
              className="ml-2 w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
