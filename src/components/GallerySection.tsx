"use client";
import { MapPin, Clock } from "lucide-react";

interface GalleryPost {
  id: number;
  businessName: string;
  location: string;
  caption: string;
  imageUrl: string;
  timestamp: string;
}

export function GallerySection() {

  const scrollToWaitlist = () => {
    const element = document.getElementById("cta"); // This looks for id="cta" in your main file
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  // SIMULATED REALISM: Fake names/locations that FEEL real
  const galleryPosts: GalleryPost[] = [
    {
      id: 1,
      businessName: "Yoga By the Lake",
      location: "Lake Shore Blvd W, Etobicoke",
      caption: `I keep hearing about the surge of outdoor yoga classes in Mimico as spring settles in, and many of us still find ourselves tangled in tight shoulders from desk work.  

      Here's how to get there:
      
      1. Arrive 10 minutes early to claim a spot on the sun‑warmed wooden deck by the creek.
      
      2. Bring a lightweight navy‑blue mat to match the studio’s palette and stay grounded on the breezy surface.
      
      3. Sip the herbal tea we leave at the entrance to calm the mind before the first stretch.
      
      4. Follow our guided breath sequence that syncs with the gentle lapping of Lake Ontario’s waves.
      
      5. End with a short savasana under the maple trees, letting the spring air seal your practice.  
      
      After those five steps, you’ll feel the warm sun 🌞 on your skin, the crisp lake scent mingling with fresh pine, and a calm clarity in your mind. At The Yoga By the Lake, we curate each session to weave that coastal calm into our downtown studio, so you can carry it home. Drop by tomorrow morning; the mat is waiting for you.  
      
      #Mimico #YogaStudio #EtobicokeWellness`,
      imageUrl: "https://sqevbzmyxfydanimdcwp.supabase.co/storage/v1/object/public/post-images/1776435133504-evnkrh.png",
      timestamp: "APR 20, 11:18 AM",
    },
    {
      id: 2,
      businessName: "Lakeside Shawarma",
      location: "York St, Toronto",
      caption: `When the Harbourfront joggers pause for a quick bite, I know they’re craving something warm and satisfying after their morning stretch. 🌊  

Imagine sinking your teeth into our juicy shawarma, the garlic sauce tingling on your palate, and a crisp, fresh side waiting beside it, brightening your day. 🍽️  

That’s why we’re tucking a free side dish with your order until April 30th, just for our neighbors strolling by the Lakeshore and the families gathering after a walk`,
      imageUrl: "https://sqevbzmyxfydanimdcwp.supabase.co/storage/v1/object/public/post-images/1776698413755-oxqggb.png",
      timestamp: "APR 18, 2:04 PM",
    },
    {
      id: 3,
      businessName: "Gody's Hair Salon.",
      location: "Richmond St W, Toronto",
      caption: `After a sunrise waterfront yoga session along the Harbourfront, I still feel the lake’s cool breeze on my skin, and the thought of a bustling morning at Gody Salon nudges me awake.  

By the time the first client settles into the chair, the air is scented with warm rosemary oil, the mirrors gleam, and navy‑blue towels are folded just so, inviting you to unwind.  

I hand‑mix that rosemary blend in our back room, right beside the window that frames the CN Tower’s silhouette. Watching the tower catch the sunrise reminds me why we love serving our Harbourfront neighbors.  

If you’re strolling past the Rogers Centre later, swing by for a quick scalp refresh – no appointment needed, just a friendly hello. 🌿  

#Harbourfront #TorontoHair #SpringRefresh #GodySalon`,
      imageUrl: "https://sqevbzmyxfydanimdcwp.supabase.co/storage/v1/object/public/post-images/1776610094048-np2ehp.png",
      timestamp: "APR 12, 3:35 PM",
    },
    {
      id: 4,
      businessName: "College Realty Team",
      location: "College St, Toronto",
      caption: `The spring buying surge in Little Italy means my mornings still start with the familiar scramble for a quick espresso while checking the latest MLS updates on my phone.

By the time I settle at my desk on College Street, the scent of fresh coffee mixes with the low hum of the hallway, and I can see the sunrise glow off the brick façades of St. Clair West cafés ☕.

That moment is when I pull the newest market report, highlight a condo that just hit the floor plan, and walk a client through the view of the nearby Little Italy park, reminding them why this block feels like home. I’ve watched families celebrate their first spring move right outside the historic St. Clair West bakery, and I’m ready to help you find a spot where your own routine can unfold. If you’re curious about a quiet corner or a vibrant walk‑up, swing by the suite in College St – the kettle’s on and the market’s waiting.

#LittleItaly #TorontoRealEstate #SpringMarket`,
      imageUrl: "https://image.pollinations.ai/prompt/Professional%20photography%20of%20A%20medium%20scene%20from%20inside%20a%20sunlit%20office%20suite%20showing%20the%20side%20silhouette%20of%20a%20person%20looking%20out%20a%20large%20window%20at%20the%20historic%20red%20brick%20buildings%20and%20the%20lush%20budding?width=1024&height=1024&nologo=true&seed=926569&model=flux",
      timestamp: "APR 15, 9:03 AM",
    },
    {
      id: 5,
      businessName: "Smile Dental",
      location: "Rutherford, Vaughan",
      caption: `Easter events are popping up all over Vaughan this April, and I hear the kids are already buzzing about the egg hunts.

When I step into Smile Dental each morning, the scent of fresh coffee ☕ mixes with the faint hum of the sterilizer, and I watch Mrs. Patel from next door settle into the chair, her smile already brightening the room.

After her check‑up, she tells me about the new patio at the Vaughan Mills food court, and I can’t help but feel we’re all part of the same lively neighborhood rhythm.

If you’re planning a quick visit before the weekend rush, the chair is ready and the kettle is on—just swing by, and we’ll make sure your smile is as ready for the festivities as the rest of us.


#Vaughan #DentalCare #Smile
`,
      imageUrl: "https://sqevbzmyxfydanimdcwp.supabase.co/storage/v1/object/public/post-images/1776289007259-cqe5u.png",
      timestamp: "APR 15, 5:35 AM",
    },
    {
      id: 6,
      businessName: "Eastside Eatery",
      location: "Queen St E, Toronto",
      caption: `The Beaches waterfront mornings often start with the scent of fresh coffee drifting from the nearby cafés, and I’m still half‑asleep when the first order rolls in.

By 7 am the kitchen hums with the sizzle of garlic, the bright orange of roasted peppers, and the warm glow of our gold‑trimmed spice rack as I hand‑roll each shawarma.

I whisk a splash of lemon into the yogurt sauce, slice crisp lettuce harvested from the community garden, and sprinkle a pinch of sea‑salt that reminds me of the lake’s breeze. Watching the steam rise, I feel the rhythm of our little dockside crew, all ready to serve friends strolling by the boardwalk.

If you’re out for a walk along the waterfront, pop in for a quick taste – we’ll have a fresh roll waiting for you 😊🌊.


#TheBeaches #EastsideEats #SpringEats`,
      imageUrl: "https://image.pollinations.ai/prompt/Professional%20photography%20of%20A%20detail%20close%20up%20captures%20a%20vibrant%20arrangement%20of%20sliced%20bright%20orange%20roasted%20peppers%20and%20fresh%20lemon%20wedges%20resting%20on%20a%20warm%20textured%20wood%20prep%20surface%20In%20the%20soft%20foc?width=1024&height=1024&nologo=true&seed=604677&model=flux",
      timestamp: "APR 20, 9:00 AM",
    },
  ];

  return (
    <section className="bg-slate-50 py-16 md:py-24 border-b">
      <div className="mx-auto max-w-6xl px-6 sm:px-6">
        {/* Section Header */}
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
          See It In Action
          </h2>
          <p className="text-slate-600 max-w-2xl">
            Here is how Shoreline Studio generates hyper-local, context-aware content that sounds exactly like your business.
          </p>
        </div>

        {/* ─── MASONRY GRID ─── */}
        {/* 
            Using Tailwind's 'columns' property creates a true masonry/waterfall layout.
            It automatically flows items into columns, allowing for variable heights.
        */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {galleryPosts.map((post) => (
            <div
              key={post.id}
              className="break-inside-avoid flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
            >
              {/* 1. Header */}
              <div className="p-4 pb-3">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {post.businessName}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{post.location}</span>
                </div>
              </div>

              {/* 2. Caption Snippet */}
              <div className="px-4 pb-3">
                <p className="text-xs text-slate-600 leading-relaxed italic whitespace-pre-wrap">
                  {post.caption}
                </p>
              </div>

              {/* 3. Image */}
              <div className="relative w-full aspect-square bg-slate-100">
                <img
                  src={post.imageUrl}
                  alt={post.businessName}
                  className="w-full h-full object-cover"
                />
                {/* 4. Timestamp Overlay */}
                <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-md text-white text-[8px] px-2 py-1 rounded-md flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {post.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-6 text-sm md:text-base">
            Ready to see what Shoreline can generate for your business?
          </p>
          <button 
            onClick={scrollToWaitlist} 
            className="rounded-lg bg-cyan-800 hover:bg-cyan-900 text-white px-8 py-3 text-lg font-semibold transition-colors shadow-md"
          >
            Join the Waitlist
          </button>
        </div>
      </div>
    </section>
  );
}