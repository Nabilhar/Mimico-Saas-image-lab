  // src/lib/frameworks.ts

 export type Framework = "PAS" | "BAB" | "AIDA";
 export type PurchaseType = "pain-driven" | "lifestyle" | "considered-purchase";

 export const BUSINESS_ARCHETYPES: Record<string, PurchaseType> = {
    "Health & Wellness":      "pain-driven",
    "Home Services":          "pain-driven",
    "Automotive":             "pain-driven",
    "Trades & Industrial":    "pain-driven",
    "Food & Beverage":        "lifestyle",
    "Beauty & Personal Care": "lifestyle",
    "Fitness & Recreation":   "lifestyle",
    "Retail":                 "lifestyle",
    "Pets":                   "lifestyle",
    "Events & Hospitality":   "lifestyle",
    "Professional Services":  "considered-purchase",
    "Real Estate & Property": "considered-purchase",
    "Education & Childcare":  "considered-purchase",
    "Technology":             "considered-purchase",
  };

    const matrix: Record<string, Record<PurchaseType, Framework>> = {
      "5 Tips":             { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
      "Promotion / offer":  { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
      "Local event / news": { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
  };

  export function getFramework(category: string, postType: string, voice: string): Framework {
    if (postType === "Myth-busting")      return "PAS";
    if (postType === "Behind the scenes") return "BAB";
    if (voice === "Bold & Direct")          return "PAS";

    const archetype = (BUSINESS_ARCHETYPES[category] || "lifestyle") as PurchaseType;

    if (voice === "Bold & Direct" && archetype === "pain-driven") return "PAS";

    return matrix[postType]?.[archetype] || "PAS";
  }


  export const POST_TYPE_CTA_OVERRIDE: Partial<Record<string, string>> = {
    "Promotion / offer": `CTA OVERRIDE: Only action is "show this post on phone upon arrival". Phrase warmly (e.g., "Just show this post to the team"). No links/DMs.`,
    "Local event / news": `CTA OVERRIDE: Only action is "stop by on way to/from the event". No links/booking.`,
  };


   //Narative
   export type NarrativeFn = (type: string, details: string, fullAddress: string) => string;
   export type NarrativeEntry = string | NarrativeFn;
 
   export const NARRATIVE_COMBINATIONS: Record<string, NarrativeEntry> = {
 
      "PAS_5 Tips": `
    Intro: Open with one craft or trade truth the reader gets wrong in their own experience.
      Ground it in one offering from [LOCAL_GROUND_TRUTH] Offerings if it fits naturally.
      The owner is sharing a truth — not watching customers make mistakes.
      One sentence on what getting this wrong costs — time, money, or comfort.
    Tips: Exactly 5 numbered tips. Each one punchy, actionable, category-specific.
      Category knowledge only. No specific product mention.
      No tip uses generic wisdom a non-expert could write, or implies/requires visiting the business.
      No tip describes production, preparation, or storage — write from the customer's side of the experience.
      Tips teach the reader what to look for, choose, or notice — not how to make or replicate anything.
      Local grounding belongs in the opener and close — not the tips.
    Outro: Exactly one sentence.
      The offering or craft earns its place here — not in the tips.
      Landmark if natural. No emoji pile. No second or third sentence.
    Voice note: The [TONE] definition above governs personality.
    PAS governs structure only.`,
  
      "PAS_Myth-busting": `
    Hook: State a widely-held craft or trade misconception as fact — then pull the rug.
      The myth must be something the reader might actually believe.
      Not about the business's location or reputation.
      Do not open with "I see people think..." — state the myth directly as fact.
    Agitate: One sentence on the real cost of believing this myth.
    Solve: The truth, delivered in 2-3 sentences maximum.
      No mention of the business, products, hours, or location.
      No CTA of any kind — not even a soft one.
      The reader finishes knowing something true — not knowing where to buy something.
    Voice note: The [TONE] definition above governs personality.
    PAS governs structure only.`,
    
      "PAS_Behind the scenes": `
    Hook: One specific, ordinary moment in the business day — 
      a detail most customers never think about but immediately recognise as true.
      Not something the owner observes about customers. Something that happens inside the work.
    Agitate: What goes wrong when businesses skip this step.
      One sentence. The cost is real — not dramatic.
    Solve: This is why we do it.
      One specific detail — time, texture, temperature, or process.
      Something that would only exist if you'd done this for years.
      Landmark if natural. Warm close. No CTA.
    Voice note: The [TONE] definition above governs personality.
    PAS governs structure only.`,

      "PAS_Promotion / offer": (promoType: string, details: string, fullAddress: string): string => {
        const strategies: Record<string, string> = {
          discount: "Frame the saving as a neighbourly heads-up, not a sale. Words like 'lighter on the wallet'.",
          freebie:  "Frame as hospitality. 'On the house', 'tucked in for you'. Gift, not transaction.",
          custom:   "Frame around 'why now'. A local moment, milestone, or weather. 'Just for us' feeling.",
        };
        return `
        Hook: A local moment, season, or community truth that makes this offer 
          feel like it arrived at exactly the right time.
          Not a pain the owner observes — a moment the reader recognises.
        Agitate: One sentence. The subtle cost of missing this — 
          not dramatic, not manufactured urgency.
        Solve: ${strategies[promoType] || "Neighbourly and warm."}
          Data: ${details} — woven naturally into the body, not dropped in the CTA.
        CTA: Invite them to show this post in person. 
          Warm, specific to the offer. No links. One action only.
        Rule: No "limited time offer" anywhere in the post.
          If a deadline exists in the offer details, state it explicitly.
          If no deadline was provided, omit any time limit entirely.
        Voice note: The [TONE] definition above governs personality.
        PAS governs structure only.`;
      },
        
      "PAS_Local event / news": (eventType: string, details: string, fullAddress: string): string => `
    Hook: One craft or community truth the owner knows deeply —
      relevant to this moment, season, or neighbourhood energy.
      Not something the owner observes. A truth the reader recognises.
    Agitate: One sentence on the cost of overlooking this in daily life.
    Solve: The payoff. Delivered with authority.
      No CTA pressure — the knowledge is enough.
    Event shoutout: "${details}" woven in as a single natural reference.
      The event is context, not the story. One line maximum.
    Voice note: The [TONE] definition above governs personality.
    PAS governs structure only.`,

      // ── BAB ──────────────────────────────────────────────────────────────────
  
      "BAB_5 Tips": `
    Before: One grounded sentence on a craft or trade reality the reader lives —
      an ordinary imperfect moment they'd recognise as their own.
      Not something the owner observes. Not dramatic.
    Tips: Exactly 5 numbered tips. Each one punchy, actionable, category-specific.
      Local grounding belongs in the Before and Bridge — not the tips.
    After + Bridge: Exactly one sentence. Sensory and specific.
      The expertise lands the business naturally — don't force it.
      Landmark if natural. No emoji pile. No second or third sentence.
    Voice note: The [TONE] definition above governs personality.
    BAB governs structure only.`,
  
      "BAB_Myth-busting": `
    Before: The reader holds the wrong belief — state it as their current reality.
      Not as a "myth", not as something the owner observes.
      The misconception must be about the craft, product, or trade —
      not about the business's location or reputation.
    After: What their experience looks like once they know the truth.
      Specific and sensory — not abstract.
    Bridge: The correction, delivered with warmth.
      A local proof point if natural — from [LOCAL_GROUND_TRUTH] only.
      No invented places, events, or context.
      End with something memorable — not a CTA.
      No mention of the business, products, hours, or location.
    Voice note: The [TONE] definition above governs personality.
    BAB governs structure only.`,
  
      "BAB_Behind the scenes": `
    Before: What the customer's world looks like before they know this detail exists.
      Ordinary and specific — not dramatic.
    After: One sensory moment — what they see, feel, or taste because of this process.
      Specific enough that it could only be this business, this craft.
    Bridge: Pull back the curtain on exactly one step.
      "4am proofing" beats "we work hard".
      Something that would only exist if you'd done this for years.
      Landmark if natural. Intimate close. No CTA.
    Voice note: The [TONE] definition above governs personality.
    BAB governs structure only.`,
  
      "BAB_Promotion / offer": (promoType: string, details: string, fullAddress: string): string => {
    const strategies: Record<string, string> = {
      discount: "Before: The small sting of full price on a regular habit.\nAfter: Same habit, lighter on the wallet.",
      freebie:  "Before: A regular visit.\nAfter: They leave with something they didn't expect. 'On the house.'",
      custom:   "Before: An ordinary moment in the neighbourhood.\nAfter: That moment becomes a small celebration.",
    };
    return `
    ${strategies[promoType] || "Before: Ordinary visit.\nAfter: Something better."}
    Bridge: The natural connection between Before and After.
      ${details} — woven naturally into the body, not dropped in the CTA.
      No manufactured urgency. The offer arrives as a pleasant surprise.
    CTA: Invite them to show this post in person.
      Warm, specific to the offer. No links. One action only.
    Rule: No "limited time offer" anywhere in the post.
      If a deadline exists in the offer details, state it explicitly.
      If no deadline was provided, omit any time limit entirely.
    Voice note: The [TONE] definition above governs personality.
    BAB governs structure only.`;
      },
  
      "BAB_Local event / news": (eventType: string, details: string, fullAddress: string): string => `
    Before: The reader's ordinary moment — before knowing this craft or trade truth.
      Specific and grounded. Not something the owner observes.
      A reality the reader lives.
    After: What shifts once they know it.
      Specific and sensory — not abstract.
    Bridge: The owner as the local expert who carries this knowledge.
      Warm and authoritative. No CTA pressure — the expertise is enough.
      No invented places, events, or context. Use [LOCAL_GROUND_TRUTH] only.
    Event shoutout: "${details}" woven in as a single natural reference.
      The event is context, not the story. One line maximum.
    Voice note: The [TONE] definition above governs personality.
    BAB governs structure only.`,
  
      // ── AIDA ─────────────────────────────────────────────────────────────────
  
      "AIDA_5 Tips": `
    Attention: One bold craft or trade claim that stops the scroll —
      a specific truth, surprising fact, or counterintuitive statement.
      Not a local scene the owner observes. A claim the reader feels.
    Interest: One sentence connecting this claim to the reader's daily reality.
      Local grounding lives here if natural — not in the tips.
    Tips: Exactly 5 numbered tips. Each one punchy, actionable, category-specific.
      Local grounding belongs in the Attention and close — not the tips.
    Desire + Action: Exactly one sentence. Specific result or proof point.
      The expertise lands the business naturally — don't force it.
      Landmark if natural. No emoji pile. No second or third sentence.
    Voice note: The [TONE] definition above governs personality.
    AIDA governs structure only.`,
    
      "AIDA_Myth-busting": `
    Attention: A bold, counterintuitive craft or trade claim that stops the scroll.
      State the misconception directly as fact — then pull the rug.
      Not grounded in local observation. Grounded in the craft itself.
    Interest: One sentence on why this misconception is so widespread —
      what makes it so easy to believe.
    Desire: The truth, delivered with authority.
      A specific craft detail or proof point that makes the reader feel
      they learned something they couldn't have Googled easily.
      No mention of the business, products, hours, or location.
    Action: None.
      The truth is the action. No CTA — not even a soft one.
      No "share this" / "come see for yourself" / "stop by".
    Voice note: The [TONE] definition above governs personality.
    AIDA governs structure only.`,
  
      "AIDA_Behind the scenes": `
    Attention: One bold, specific detail about the process —
      the kind most businesses never mention.
      Something that happens inside the work, not something observed from outside.
      Concrete enough that it could only be this craft.
    Interest: Why this detail exists.
      The reason behind it — seasonal, technical, or craft-driven.
      No invented context. Use [LOCAL_GROUND_TRUTH] only if it fits naturally.
    Desire: What it means for the customer.
      The specific result they get because this step exists.
      Sensory and real — not generic ("freshest ingredients", "best quality").
    Action: One soft invitation — come in, ask about it, or see it yourself.
      Low pressure. Physically possible. No links.
    Voice note: The [TONE] definition above governs personality.
    AIDA governs structure only.`,
  
      "AIDA_Promotion / offer": (promoType: string, details: string, fullAddress: string): string => {
    const strategies: Record<string, string> = {
      discount: "Desire: Frame the saving as a concrete, tangible win — not a percentage, a real moment.",
      freebie:  "Desire: The surprise of generosity. Make it feel like a gift, not a promotion.",
      custom:   "Desire: The 'why now' — a local moment or milestone that makes this feel exclusive.",
    };
    return `
    Attention: A specific local moment, seasonal truth, or bold claim 
      that makes this offer feel inevitable — not an ad, not hype.
      The reader should think "that's exactly right" before they 
      even know there's an offer coming.
    Interest: One sentence connecting this moment —
      season, neighbourhood energy, or community context —
      to why this offer lands now specifically.
      No invented context. Use only [LOCAL_GROUND_TRUTH].
    ${strategies[promoType] || "Desire: Make it feel worth acting on."}
      ${details} — woven naturally into the body, not dropped in the CTA.
    Action: Invite them to show this post in person.
      Warm, specific to the offer. No links. One action only.
    Rule: No "limited time offer" anywhere in the post.
      If a deadline exists in the offer details, state it explicitly.
      If no deadline was provided, omit any time limit entirely.
    Voice note: The [TONE] definition above governs personality.
    AIDA governs structure only.`;
      },
  
      "AIDA_Local event / news": (eventType: string, details: string, fullAddress: string): string => `
    Attention: One bold craft or community truth —
      specific to this owner's expertise and this moment.
      A claim the reader feels, not a scene the owner observes.
    Interest: Why this detail matters right now.
      Local grounding lives here if natural — season, neighbourhood energy, community context.
      No invented context. Use [LOCAL_GROUND_TRUTH] only.
    Desire: The payoff — what the reader gains from knowing this.
      Specific and real. Not generic enthusiasm.
    Action: One soft invitation only.
      Low pressure. Physically possible. No links or booking.
    Event shoutout: "${details}" woven in as a single natural reference.
      The event is context, not the story. One line maximum.
    Voice note: The [TONE] definition above governs personality.
    AIDA governs structure only.`,
   };

   export const TIP_MODE: Partial<Record<string, "service" | "neighbourhood">> = {
    "Health & Wellness":      "service",
    "Home Services":          "service",
    "Automotive":             "service",
    "Food & Beverage":        "service",
    "Beauty & Personal Care": "service",
    "Fitness & Recreation":   "service",
    "Retail":                 "service",
    "Pets":                   "service",
    "Trades & Industrial":    "service",
    "Events & Hospitality":   "service",
    "Professional Services":  "neighbourhood",
    "Real Estate & Property": "neighbourhood",
    "Education & Childcare":  "neighbourhood",
    "Technology":             "neighbourhood",
  };

  //Visual
  export const FRAMEWORK_POST_TYPE_COMBINATIONS = {
    "PAS_5 Tips": `Visual: Solution state/benefit. Vibe: Instructive, clear.`,
    "PAS_Myth-busting": `Visual: Truth/solution state. Vibe: Authoritative, confident.`,
    "PAS_Behind the Scenes": `Visual: Solution process/work. Vibe: Authentic, revealing.`,
    "PAS_Promotion": `Visual: Benefit being offered. Vibe: Inviting, accessible.`,
    "PAS_Local Event": `Visual: Event opportunity. Vibe: Timely, community-connected.`,
    "BAB_5 Tips": `Visual: "After" state of tips. Vibe: Instructive, aspirational.`,
    "BAB_Myth-busting": `Visual: Transformation (Wrong $\rightarrow$ Correct). Vibe: Authoritative.`,
    "BAB_Behind the Scenes": `Visual: Transformation moment/after-work. Vibe: Intimate, revealing.`,
    "BAB_Promotion": `Visual: "After" state of offer. Vibe: Inviting, warm.`,
    "BAB_Local Event": `Visual: Community connection at event. Vibe: Community-first.`,
    "AIDA_5 Tips": `Visual: Attention-grabbing tip/result. Vibe: Compelling, clear.`,
    "AIDA_Myth-busting": `Visual: Surprising truth/striking difference. Vibe: Bold, credible.`,
    "AIDA_Behind the Scenes": `Visual: Desire-building detail of work. Vibe: Intimate, revealing.`,
    "AIDA_Promotion": `Visual: Attention-grabbing offer detail. Vibe: Compelling, warm.`,
    "AIDA_Local Event": `Visual: Attention-grabbing event detail. Vibe: Timely, community-connected.`,
  };

  export const getSeason = (month: string) => {
  const seasons: Record<string, string> = {
    January: "Winter", February: "Winter", March: "Spring", April: "Spring",
    May: "Spring", June: "Summer", July: "Summer", August: "Summer",
    September: "Fall", October: "Fall", November: "Fall", December: "Winter"
  };
  return seasons[month] || "Spring";
  };

    // Visual
  export const SEASONALITY_CONTEXT = {
    "Winter": {
      visual_elements: "Snow, frost, bare trees, cool tones, warm interior contrast",
      lighting_mood: "Intimate, reflective; cool outdoor vs warm indoor",
      time_of_day_guidance: "Evening: Warm interiors. Morning: Fresh, cool daylight."
    },
    "Spring": {
      visual_elements: "New growth, fresh colors, awakening, light mood",
      lighting_mood: "Fresh, bright daylight, visible new growth",
      time_of_day_guidance: "Morning: Bright daylight. Afternoon: Golden hour warmth."
    },
    "Summer": {
      visual_elements: "High energy, outdoor activity, vibrant colors",
      lighting_mood: "Bright, vibrant daylight, high energy",
      time_of_day_guidance: "Afternoon: Bright daylight. Morning: Fresh, awakening light."
    },
    "Fall": {
      visual_elements: "Warm tones, harvest, golden light, nostalgia",
      lighting_mood: "Golden light, warm tones, nostalgic",
      time_of_day_guidance: "Afternoon: Golden hour warmth. Morning: Crisp, cool light."
    }
  };
    
  //Visual
  export const SEASONAL_NICHE_CONTEXT: Record<string, Record<string, string>> = {
    "Winter": {
      "Health & Wellness": "Visual: Cozy interiors, indoor wellness. Light: Warm, soft. Focus: Recovery, warmth.",
      "Home Services": "Visual: Emergency prep, heating. Light: Reassuring, warm. Focus: Reliability, crisis.",
      "Automotive": "Visual: Tire changes, salt cleanup. Light: Industrial, bright. Focus: Durability, protection.",
      "Food & Beverage": "Visual: Warm drinks, hearty meals. Light: Golden, intimate. Focus: Comfort, gathering.",
      "Beauty & Personal Care": "Visual: Hydration, skin protection. Light: Soft, flattering. Focus: Nourishment, glow.",
      "Fitness & Recreation": "Visual: Indoor gym, energy. Light: Bright, energetic. Focus: Movement, beating slump.",
      "Retail": "Visual: Festive decor, curated gifts. Light: Warm, inviting. Focus: Gifting, discovery.",
      "Professional Services": "Visual: Consultation, planning. Light: Professional, clear. Focus: Expertise, forward-thinking.",
      "Real Estate & Property": "Visual: Snow, cozy interiors. Light: Natural daylight. Focus: Warmth, potential.",
      "Education & Childcare": "Visual: Indoor learning, warm spaces. Light: Bright, welcoming. Focus: Engagement, care.",
    },
    "Spring": {
      "Health & Wellness": "Visual: Outdoor practice, fresh air. Light: Soft, golden morning. Focus: Renewal, energy.",
      "Home Services": "Visual: Landscaping, renovation. Light: Bright, natural. Focus: Transformation, refresh.",
      "Automotive": "Visual: Car detailing, washing. Light: Bright, clear daylight. Focus: Cleanliness, care.",
      "Food & Beverage": "Visual: Seasonal produce, patios. Light: Bright, airy. Focus: Freshness, lightness.",
      "Beauty & Personal Care": "Visual: Fresh skincare, light makeup. Light: Soft, natural. Focus: Natural beauty, renewal.",
      "Fitness & Recreation": "Visual: Outdoor runs, parks. Light: Bright, energetic. Focus: Re-activation, movement.",
      "Retail": "Visual: New collections, seasonal displays. Light: Bright, inviting. Focus: Newness, discovery.",
      "Professional Services": "Visual: New projects, outdoor meetings. Light: Natural, professional. Focus: Momentum, growth.",
      "Real Estate & Property": "Visual: Blooming gardens, curb appeal. Light: Golden, warm. Focus: Potential, beauty.",
      "Education & Childcare": "Visual: Nature activities, playgrounds. Light: Bright, natural. Focus: Exploration, growth.",
    },
    "Summer": {
      "Health & Wellness": "Visual: Outdoor yoga, beach wellness. Light: Bright, golden. Focus: Vitality, freedom.",
      "Home Services": "Visual: AC repair, patio setup. Light: Bright, clear. Focus: Transformation, expertise.",
      "Automotive": "Visual: Road trips, AC checks. Light: Bright, energetic. Focus: Adventure, reliability.",
      "Food & Beverage": "Visual: Patios, cold drinks, BBQs. Light: Golden, warm. Focus: Social, enjoyment.",
      "Beauty & Personal Care": "Visual: Sun protection, glow. Light: Bright, warm. Focus: Protection, hydration.",
      "Fitness & Recreation": "Visual: Swimming, hiking, beach. Light: Bright, energetic. Focus: High energy, freedom.",
      "Retail": "Visual: Vacation gear, summer style. Light: Bright, warm. Focus: Adventure, discovery.",
      "Professional Services": "Visual: Strategy, team building. Light: Natural, professional. Focus: Growth, opportunity.",
      "Real Estate & Property": "Visual: Lush gardens, sunny interiors. Light: Bright, golden. Focus: Lifestyle, potential.",
      "Education & Childcare": "Visual: Summer camps, outdoor fun. Light: Bright, energetic. Focus: Joy, exploration.",
    },
    "Fall": {
      "Health & Wellness": "Visual: Grounding, indoor/outdoor balance. Light: Warm, golden. Focus: Stability, immunity.",
      "Home Services": "Visual: Weatherproofing, gutter cleaning. Light: Warm, natural. Focus: Foresight, care.",
      "Automotive": "Visual: Tire changes, winterization. Light: Warm, clear. Focus: Reliability, readiness.",
      "Food & Beverage": "Visual: Harvest ingredients, warm drinks. Light: Golden, intimate. Focus: Abundance, comfort.",
      "Beauty & Personal Care": "Visual: Seasonal skincare, warm tones. Light: Warm, flattering. Focus: Adaptation, care.",
      "Fitness & Recreation": "Visual: Hiking, crisp air. Light: Golden, warm. Focus: Energy, nature.",
      "Retail": "Visual: Fall fashion, home decor. Light: Warm, inviting. Focus: Preparation, discovery.",
      "Professional Services": "Visual: Year-end planning, strategy. Light: Warm, professional. Focus: Preparation, growth.",
      "Real Estate & Property": "Visual: Fall colors, cozy interiors. Light: Golden, warm. Focus: Warmth, potential.",
      "Education & Childcare": "Visual: Back-to-school, classrooms. Light: Warm, welcoming. Focus: Growth, routines.",
    }
  };
  
  //Narative
  export const SEASONAL_NICHE_NARRATIVE: Record<string, Record<string, string>> = {
    "Winter": {
      "Health & Wellness":      "Recovery, warmth, indoor wellness. Pain: blues, stiffness, dehydration.",
      "Home Services":          "Preparedness, emergency repairs, heating. Pain: frozen pipes, broken heaters.",
      "Automotive":             "Winter reliability, tire changes, salt cleanup. Pain: icy roads, wear-and-tear.",
      "Food & Beverage":        "Comfort, hearty meals, hot drinks, cozy seating. Pain: cold weather, craving warmth.",
      "Beauty & Personal Care": "Nourishment, hydration, indoor pampering. Pain: dry skin, winter dullness.",
      "Fitness & Recreation":   "Indoor energy, gym routines, beating the slump. Pain: low energy, seasonal blues.",
      "Retail":                 "Gifting, winter essentials, cozy browsing. Pain: cold weather, holiday stress.",
      "Professional Services":  "Year-end planning, tax prep, stability. Pain: end-of-year chaos, fatigue.",
      "Real Estate & Property": "Cozy interiors, heating efficiency. Pain: high bills, snow removal.",
      "Education & Childcare":  "Indoor learning, engaging environments. Pain: cold commutes, keeping kids active.",
      "Events & Hospitality":   "Festive gatherings, holiday bookings. Pain: last-minute planning, weather disruptions.",
      "Trades & Industrial":    "Emergency winterproofing, snow removal. Pain: storm damage, frozen equipment.",
      "Pets":                   "Indoor pet care, winter walks. Pain: cold paws, dry skin, cabin fever.",
      "Technology":             "Year-end upgrades, remote work support. Pain: slow systems, holiday downtime.",
    },
    "Spring": {
      "Health & Wellness":      "Renewal, outdoor practice, fresh air. Pain: winter stiffness, allergies.",
      "Home Services":          "Renovation, landscaping, spring repairs. Pain: mud, thaw damage, overwhelm.",
      "Automotive":             "Detailing, spring inspection, salt cleanup. Pain: residue, winter wear.",
      "Food & Beverage":        "Freshness, patio dining, seasonal produce. Pain: craving light, post-winter.",
      "Beauty & Personal Care": "Skincare refresh, spring glow, outdoor beauty. Pain: post-winter skin.",
      "Fitness & Recreation":   "Re-activation, outdoor runs, movement. Pain: restarting routines, lethargy.",
      "Retail":                 "New collections, spring arrivals, outdoor gear. Pain: seasonal transition.",
      "Professional Services":  "Growth, new projects, spring strategy. Pain: post-winter disorganization.",
      "Real Estate & Property": "Curb appeal, spring listings, blooming gardens. Pain: cleaning, presentation.",
      "Education & Childcare":  "Outdoor learning, new routines, spring activities. Pain: routine transitions.",
      "Events & Hospitality":   "Outdoor events, spring bookings, fresh energy. Pain: weather unpredictability.",
      "Trades & Industrial":    "Landscaping, exterior repairs, spring prep. Pain: backlog, thaw damage.",
      "Pets":                   "Outdoor walks, spring grooming, shedding season. Pain: mud, allergies.",
      "Technology":             "Spring audits, system refresh, Q2 planning. Pain: outdated setups, slow starts.",
    },
    "Summer": {
      "Health & Wellness":      "Vitality, hydration, outdoor activity. Pain: heat exhaustion, sun damage.",
      "Home Services":          "AC repair, patio setup, exterior care. Pain: summer heat, storm prep.",
      "Automotive":             "Road trips, AC checks, summer maintenance. Pain: heat, long drives.",
      "Food & Beverage":        "Cold drinks, BBQs, patio dining. Pain: heat, craving freshness.",
      "Beauty & Personal Care": "Sun care, lightweight products, summer glow. Pain: humidity, sun damage.",
      "Fitness & Recreation":   "Swimming, hiking, high-energy outdoor living. Pain: heat, humidity.",
      "Retail":                 "Travel gear, summer fashion, outdoor living. Pain: prep, seasonal shift.",
      "Professional Services":  "Mid-year reviews, summer projects, momentum. Pain: slowdown, busy schedules.",
      "Real Estate & Property": "Outdoor showings, curb appeal, patio living. Pain: high demand, heat.",
      "Education & Childcare":  "Summer camps, outdoor adventure, exploration. Pain: boredom, keeping active.",
      "Events & Hospitality":   "Outdoor events, peak season bookings. Pain: capacity, heat management.",
      "Trades & Industrial":    "Pool service, irrigation, exterior projects. Pain: heat, peak demand.",
      "Pets":                   "Hydration, outdoor safety, grooming. Pain: overheating, paw burns.",
      "Technology":             "Summer downtime audits, backup systems. Pain: skeleton crews, system strain.",
    },
    "Fall": {
      "Health & Wellness":      "Immunity, routine reset, cozy wellness. Pain: seasonal shift, getting back on track.",
      "Home Services":          "Weatherproofing, gutter cleaning, heating prep. Pain: storms, cold onset.",
      "Automotive":             "Winter-readiness, tire changes, fluid checks. Pain: first frost, salt prep.",
      "Food & Beverage":        "Harvest flavors, warm drinks, cozy dining. Pain: cooling weather, comfort cravings.",
      "Beauty & Personal Care": "Hydration, seasonal skincare transition. Pain: dry skin, changing climate.",
      "Fitness & Recreation":   "Hiking, crisp air workouts, outdoor movement. Pain: shorter days, cooler temps.",
      "Retail":                 "Fall fashion, home decor, back-to-school. Pain: seasonal prep, wardrobe shift.",
      "Professional Services":  "Q4 strategy, year-end planning, reviews. Pain: end-of-year rush, fatigue.",
      "Real Estate & Property": "Autumn curb appeal, cozy interiors, maintenance. Pain: winter prep, presentation.",
      "Education & Childcare":  "Back-to-school, structured routines, readiness. Pain: summer-to-school transition.",
      "Events & Hospitality":   "Fall gatherings, harvest events, cozy bookings. Pain: weather shifts, scheduling.",
      "Trades & Industrial":    "Gutter clearing, winterization, pre-snow prep. Pain: backlog, weather windows.",
      "Pets":                   "Fall grooming, routine reset, outdoor safety. Pain: mud, ticks, shorter walks.",
      "Technology":             "Q4 upgrades, year-end audits, holiday prep. Pain: system strain, budget cycles.",
    },
  };

  export const ANGLE_POOL: Record<string, Partial<Record<string, string[]>>> = {

    "Food & Beverage": {
      "5 Tips": [
        "The freshness signal a customer can read before the first bite — not how it's stored, but what to look for",
        "What temperature does to the eating experience — what the customer notices, not what happens in production",
        "The difference between artisan and industrial versions of the same product — what shows up on the customer's side",
        "The single detail that determines whether two similar products age well or fail early",
        "The combination or pairing that changes how the product is experienced",
        "The storage mistake that silently degrades quality before it becomes obvious",
        "The timing factor that determines peak quality in one category of products",
      ],
      "Myth-busting": [
        "The 'fresh means longer lasting' assumption — real food degrades faster because nothing is suppressing it",
        "The cold storage assumption — refrigeration preserves some things and actively damages others",
        "The price-quality assumption — premium pricing reflects marketing spend more often than production quality",
        "The 'natural equals safe' assumption — natural ingredients can be just as processed as synthetic ones",
        "The preservative assumption — short shelf life is a quality signal, not a flaw",
        "The ingredient sensitivity assumption — most reactions are triggered by processing, not the base ingredient",
      ],
      "Behind the scenes": [
        "The early decision that determines the final quality of the entire batch",
        "The single process step that quietly defines consistency",
        "What experienced makers notice in seconds that customers never detect",
        "The one variable that separates an average batch from a great one",
        "What failure looks like in production before it becomes visible to customers",
      ],
      "Local event / news": [
        "How seasonal demand shifts what gets made and how it's made",
        "The environmental or timing shift that changes production decisions",
        "What busy local periods reveal about demand patterns",
        "How community activity subtly changes output and timing priorities",
      ],
    },
  
    "Health & Wellness": {
      "5 Tips": [
        "The body signal that is commonly misread — and what it actually indicates",
        "What happens when a recurring issue is ignored over time",
        "The recovery mistake that quietly slows progress more than people realize",
        "How movement patterns compound into long-term physical limitations",
        "The first window of action that determines recovery outcomes",
        "The hydration or sleep factor that most people underestimate until it affects performance",
        "The difference between short-term relief and structural improvement",
      ],
      "Myth-busting": [
        "The 'no pain no gain' assumption — pain is a warning signal, not a progress indicator",
        "The rest equals recovery assumption — controlled movement heals faster than immobility in most cases",
        "The perfect posture assumption — static posture is the problem, not the solution",
        "The ice vs heat assumption — most people apply both at the wrong time for the wrong reason",
        "The ageing equals decline assumption — most physical decline is disuse, not inevitability",
      ],
      "Behind the scenes": [
        "What is identified in the first assessment that changes the entire plan",
        "The question that reveals more than any test or measurement",
        "What intake observations reveal that symptoms alone do not",
        "Why similar cases receive completely different treatment approaches",
        "What changes in real-time observation that patients don't notice",
      ],
      "Local event / news": [
        "How seasonal shifts influence common physical patterns in the community",
        "The recurring pattern that appears at specific times of year",
        "What local activity trends reveal about common strain or injury types",
        "How environmental changes affect recovery and performance patterns",
      ],
    },
  
    "Home Services": {
      "5 Tips": [
        "The early warning sign that appears long before a costly failure",
        "What seasonal changes quietly do to systems over time",
        "The preventative action that avoids the most expensive future repairs",
        "How to distinguish surface-level issues from structural problems",
        "The question that reveals the quality of any service provider",
        "The common fix that unintentionally increases long-term costs",
        "The material choice that looks identical but behaves differently under stress",
      ],
      "Myth-busting": [
        "The DIY simplicity assumption — what looks straightforward online involves compounding decisions tradespeople train for",
        "The lowest quote assumption — margin reductions always come from somewhere in the job",
        "The delay-it-later assumption — most home issues don't pause, they compound",
        "The new equals problem-free assumption — new builds have as many defects as older ones, just different ones",
        "The insurance coverage assumption — most policies exclude far more than homeowners expect",
      ],
      "Behind the scenes": [
        "What is evaluated before any work begins that determines the entire approach",
        "What experienced tradespeople identify immediately that others miss",
        "The preparation step that determines long-term durability",
        "What callback jobs typically reveal about original execution",
        "The unseen decision that affects longevity more than visible work",
      ],
      "Local event / news": [
        "What current weather patterns mean for local systems and infrastructure",
        "How seasonal transitions affect maintenance priorities",
        "What local development activity signals for property conditions",
        "How regional changes influence common repair needs",
      ],
    },
  
    "Beauty & Personal Care": {
      "5 Tips": [
        "The layering mistake that cancels out product effectiveness",
        "What skin or hair actually does during seasonal transitions",
        "The tool or technique error that changes expected results",
        "How ingredient order determines product performance",
        "The difference between surface improvement and underlying change",
        "What professional treatments achieve that at-home routines cannot",
        "The timing error that slows visible results significantly",
      ],
      "Myth-busting": [
        "The 'more product equals better results' assumption — concentration matters more than volume",
        "The 'natural equals safe' assumption — natural ingredients can irritate, sensitize, and destabilize skin",
        "The 'higher price equals higher performance' assumption — formulation determines efficacy, not price point",
        "The SPF number assumption — SPF measures one type of radiation and degrades faster than most people reapply",
        "The hair washing frequency assumption — scalp health responds to consistency, not reduction",
      ],
      "Behind the scenes": [
        "What is observed during consultation that reshapes the entire approach",
        "The first visual assessment that experienced practitioners rely on",
        "The preparation step clients rarely see but always benefit from",
        "Why identical concerns often require different treatment paths",
        "What determines outcome differences between similar treatments",
      ],
      "Local event / news": [
        "How seasonal conditions directly affect skin and hair behaviour",
        "What environmental shifts change common client concerns",
        "How local lifestyle patterns influence treatment demand",
        "What time of year reveals about care priorities",
      ],
    },
  
    "Fitness & Recreation": {
      "5 Tips": [
        "The warm-up mistake that leads to the most avoidable injuries",
        "What progressive overload actually looks like in practice",
        "The recovery tradeoff that limits long-term progress",
        "How to distinguish productive strain from harmful pain",
        "The form detail that changes the outcome of a movement",
        "What consistency builds that intensity alone cannot",
        "The timing factor that affects performance more than effort",
      ],
      "Myth-busting": [
        "The soreness equals progress assumption — DOMS indicates novelty, not adaptation",
        "The cardio equals fat loss assumption — energy balance determines fat loss, not modality",
        "The spot reduction assumption — fat is mobilized systemically, not locally",
        "The more training equals better results assumption — recovery is where adaptation happens",
        "The machines vs free weights assumption — the difference is stability demand, not muscle recruitment",
      ],
      "Behind the scenes": [
        "What coaches observe in early sessions that predicts long-term outcomes",
        "The programming decision that drives progress but looks arbitrary",
        "Why identical workouts produce different results",
        "What environmental factors influence performance more than expected",
        "What is evaluated before a training plan is built",
      ],
      "Local event / news": [
        "How seasonal conditions influence training performance",
        "What local activity trends reveal about common training needs",
        "How community events influence motivation patterns",
        "What seasonal shifts do to consistency and recovery",
      ],
    },
  
    "Professional Services": {
      "5 Tips": [
        "The document most people only prepare after it becomes urgent",
        "The deadline that quietly creates the highest long-term cost when missed",
        "What should be prepared before any consultation for maximum value",
        "The question that changes the quality of professional advice received",
        "The difference between urgent decisions and strategic decisions",
        "What life or status changes trigger overlooked obligations",
        "The assumption that creates avoidable downstream problems",
      ],
      "Myth-busting": [
        "The 'I'll deal with it later' assumption — most professional problems compound interest the longer they sit",
        "The DIY tool assumption — online tools handle standard cases and quietly fail on the exceptions",
        "The one-size-fits-all assumption — generic advice optimizes for the average case, not yours",
        "The 'my case is too simple' assumption — simple cases have the highest rate of overlooked details",
        "The cost vs consequence assumption — professional fees are typically a fraction of the cost of errors",
      ],
      "Behind the scenes": [
        "What is reviewed before client meetings to shape outcomes",
        "What experienced professionals detect that templates miss",
        "The follow-up action that determines completion quality",
        "Why similar cases lead to different recommendations",
        "What becomes critical later that seems minor at intake",
      ],
      "Local event / news": [
        "What local or regulatory changes mean for planning decisions",
        "The deadline or policy shift affecting the community",
        "What neighbourhood developments imply for long-term planning",
        "What seasonal timing means for professional decisions",
      ],
    },
  
    "Retail": {
      "5 Tips": [
        "The quality signal that matters more than price in this category",
        "The usage or wear factor that determines product lifespan",
        "The detail missing from descriptions that affects performance",
        "The compatibility or fit mistake that leads to poor outcomes",
        "How to distinguish real quality from presentation quality",
        "The combination or pairing that improves usability significantly",
        "The pre-purchase question that prevents most regret purchases",
      ],
      "Myth-busting": [
        "The brand loyalty assumption — brand recognition is built through marketing, not consistently superior product",
        "The discount equals value assumption — markdowns often signal overstock or end-of-cycle product",
        "The newer equals better assumption — product cycles prioritize differentiation over improvement",
        "The care label literal interpretation assumption — instructions are conservative minimums, not optimal conditions",
        "The price equals quality assumption — retail markup varies so widely that price is a poor quality proxy",
      ],
      "Behind the scenes": [
        "What determines whether a product is selected or rejected for sale",
        "What sourcing decisions reveal about final product quality",
        "What experienced buyers evaluate beyond specifications",
        "What happens before a product reaches shelves or listings",
        "How seasonal purchasing decisions are made in advance",
      ],
      "Local event / news": [
        "How seasonal demand shifts what customers prioritize",
        "What local trends reveal about purchasing behaviour",
        "How community changes influence product selection",
        "What timing patterns affect buying decisions",
      ],
    },
  
    "Pets": {
      "5 Tips": [
        "The behavioural signal that is often misunderstood by owners",
        "How seasonal changes alter needs without obvious signs",
        "The feeding or nutrition pattern that quietly creates issues",
        "How to distinguish normal behaviour from early warning signs",
        "The care step most owners delay until problems appear",
        "What stress indicators look like in different animals",
        "The enrichment gap that affects behaviour more than expected",
      ],
      "Myth-busting": [
        "The dominance behaviour assumption — most unwanted behaviour is anxiety or miscommunication, not hierarchy",
        "The human food harm assumption — toxicity is dose and species dependent, not categorical",
        "The indoor pet sufficiency assumption — indoor animals have unmet environmental and sensory needs",
        "The age explains behaviour assumption — most age-attributed behaviour changes have earlier, addressable causes",
        "The breed determines behaviour assumption — individual history and environment outweigh breed generalizations",
      ],
      "Behind the scenes": [
        "What is observed immediately when interacting with an animal",
        "What pre-service assessment reveals about home environment",
        "Why identical animals respond differently to the same care",
        "What early behaviour signals indicate about routine at home",
        "What handlers adjust before interaction begins",
      ],
      "Local event / news": [
        "How seasonal conditions affect local pet behaviour",
        "What environmental hazards emerge at specific times of year",
        "What community patterns influence pet care needs",
        "How weather shifts affect animal routines",
      ],
    },
  
    "Automotive": {
      "5 Tips": [
        "The warning sign that appears long before mechanical failure",
        "How seasonal conditions affect vehicle systems quietly over time",
        "The maintenance interval that most people underestimate",
        "How to interpret repair quotes for real value differences",
        "The driving habit that accelerates wear in specific components",
        "What to check before travel that prevents major disruption",
        "The overlooked component that often causes system failure",
      ],
      "Myth-busting": [
        "The oil interval assumption — modern engine tolerances are tighter, not more forgiving than older guidance suggests",
        "The premium fuel assumption — octane rating affects knock resistance, not energy output or engine longevity",
        "The warm-up time assumption — modern fuel injection systems reach operating temperature faster under load than at idle",
        "The dealership requirement assumption — warranty compliance requires documented maintenance, not dealer-specific labour",
        "The all-season tire assumption — all-season compounds harden below 7°C and lose the grip winter tires are designed for",
      ],
      "Behind the scenes": [
        "What is inspected before any repair is quoted",
        "What experienced technicians detect without diagnostic tools",
        "How parts selection affects long-term reliability",
        "Why similar symptoms lead to different diagnoses",
        "What post-repair testing is actually validating",
      ],
      "Local event / news": [
        "How seasonal road conditions affect vehicle maintenance needs",
        "What local weather patterns mean for vehicle systems",
        "How infrastructure changes affect driving conditions",
        "What seasonal transitions mean for vehicle reliability",
      ],
    },
  
    "Education & Childcare": {
      "5 Tips": [
        "The environmental factor that impacts learning more than curriculum",
        "What consistency builds that short-term intensity cannot",
        "The transition point most families underestimate",
        "How to distinguish temporary phases from meaningful patterns",
        "The home habit that reinforces or undermines learning outcomes",
        "The question that reveals more than standard progress reports",
        "The developmental principle that contradicts common assumptions",
      ],
      "Myth-busting": [
        "The early pressure equals success assumption — earlier academic exposure correlates with higher anxiety, not higher achievement",
        "The screen time uniform effect assumption — content and context determine impact more than duration",
        "The learning styles assumption — no evidence supports matching instruction to preferred modality",
        "The 'they'll grow out of it' assumption — most patterns that persist past a window become harder to address",
        "The homework volume equals learning assumption — retention correlates with spacing and retrieval, not time spent",
      ],
      "Behind the scenes": [
        "What is observed in the first days that shapes planning",
        "What experienced educators detect before formal assessment",
        "How environments are adjusted without disrupting routines",
        "Why similar learners receive different approaches",
        "What preparation happens before daily programming begins",
      ],
      "Local event / news": [
        "How seasonal changes affect learning behaviour",
        "What community cycles influence development and routines",
        "What transitions in the year reveal about readiness",
        "What local patterns show in behaviour and attention",
      ],
    },
  
    "Technology": {
      "5 Tips": [
        "The security gap most users leave open without realizing it",
        "What actually slows systems down beyond obvious causes",
        "The backup assumption that leads to data loss",
        "How to interpret system behaviour as early warning signals",
        "The configuration setting that silently impacts performance",
        "What system lag usually indicates underneath the surface",
        "The upgrade timing mistake most users make",
      ],
      "Myth-busting": [
        "The antivirus equals safety assumption — antivirus addresses known signatures; most breaches exploit behaviour, not files",
        "The cloud equals backup assumption — sync replicates deletions and corruptions instantly across all devices",
        "The new device equals secure setup assumption — out-of-box configuration prioritizes usability over security",
        "The 'I'm not a target' assumption — most attacks are automated and target vulnerabilities, not specific individuals",
        "The IT cost vs risk assumption — the average cost of a single incident exceeds years of preventative support",
      ],
      "Behind the scenes": [
        "What is assessed before recommending any solution",
        "What experienced technicians identify beyond surface symptoms",
        "What infrastructure decisions affect reliability most",
        "Why similar setups have different risk profiles",
        "What ongoing monitoring reveals over time",
      ],
      "Local event / news": [
        "How local business patterns affect tech needs",
        "What remote and hybrid work shifts change technically",
        "What seasonal business cycles mean for systems",
        "How regional growth affects infrastructure demands",
      ],
    },
  
    "Events & Hospitality": {
      "5 Tips": [
        "The planning timeline error that increases cost and stress",
        "What vendors need that clients often fail to provide",
        "The detail guests remember most that planners underinvest in",
        "How to interpret a quote for hidden exclusions",
        "The contingency most first-time planners overlook",
        "What separates a smooth event from a reactive one",
        "The day-of factor that determines execution quality",
      ],
      "Myth-busting": [
        "The scale equals quality assumption — larger events have more variables, not better outcomes",
        "The DIY saves money assumption — coordination time and error cost typically exceed vendor fees",
        "The cheapest vendor equals best value assumption — margin cuts always surface somewhere in execution",
        "The 'it will work out on the day' assumption — day-of problems are always pre-existing problems",
        "The perfection matters most assumption — guests remember atmosphere and feeling, not flawless logistics",
      ],
      "Behind the scenes": [
        "What is confirmed in the final week that changes everything",
        "What is discovered during venue walkthroughs",
        "What coordination determines day-of success",
        "Why identical budgets produce different experiences",
        "What contingency planning actually prepares for",
      ],
      "Local event / news": [
        "How seasonal demand affects booking availability",
        "What local venue changes mean for planning timelines",
        "What community events influence hospitality demand",
        "What time-of-year patterns affect event planning",
      ],
    },
  
    "Real Estate & Property": {
      "5 Tips": [
        "The preparation step that changes final selling outcomes",
        "What buyers prioritize that often surprises sellers",
        "How inspection findings should actually be interpreted",
        "What market data reveals beyond surface pricing",
        "The hidden cost that first-time buyers often underestimate",
        "What property history reveals beyond listing details",
        "The timing decision that significantly affects outcomes",
      ],
      "Myth-busting": [
        "The seasonal market assumption — inventory and competition shift seasonally, but price drivers are largely independent",
        "The renovation ROI assumption — most renovations recover less than 70% of cost at sale",
        "The listing price equals value assumption — asking price is a negotiation opener, not a market assessment",
        "The open house equals buyer source assumption — most buyers in active markets are already working with agents",
        "The online estimate accuracy assumption — algorithms use historical sales data and miss condition, context, and timing",
      ],
      "Behind the scenes": [
        "What happens before a property is officially listed",
        "What experienced agents notice in first walkthroughs",
        "What determines final negotiation outcomes",
        "Why comparable properties sell differently",
        "What buyers don't see in offer evaluation",
      ],
      "Local event / news": [
        "How zoning or development changes affect property value",
        "What seasonal market cycles mean locally",
        "What neighbourhood shifts reveal about demand",
        "What historical timing patterns show in pricing",
      ],
    },
  
    "Trades & Industrial": {
      "5 Tips": [
        "The early failure signal most property owners ignore",
        "How seasonal shifts affect system durability",
        "The maintenance step that prevents high-cost failures",
        "How to interpret quotes for real value differences",
        "The material difference that looks identical but performs differently",
        "What preparation steps affect job quality significantly",
        "What to verify before approving completed work",
      ],
      "Myth-busting": [
        "The cheapest quote equals best value assumption — lower margins mean reduced material grade, labour time, or both",
        "The 'it can wait' assumption — most system failures follow a compounding pattern, not a sudden one",
        "The DIY tutorial equals professional work assumption — tutorials show the procedure, not the judgment calls within it",
        "The permit is optional assumption — unpermitted work voids insurance coverage and creates liability at resale",
        "The material grade equivalence assumption — spec-grade and retail-grade products share names but not tolerances",
      ],
      "Behind the scenes": [
        "What determines job scope before work begins",
        "What experienced tradespeople notice immediately",
        "What affects durability more than visible execution",
        "Why similar jobs have different timelines",
        "What unseen decisions determine longevity",
      ],
      "Local event / news": [
        "How seasonal conditions affect infrastructure demands",
        "What weather patterns mean for maintenance needs",
        "What local construction trends imply for properties",
        "What regional development means for system stress",
      ],
    },
  };