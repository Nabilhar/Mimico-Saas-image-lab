// lib/lens-groups.ts

import { CognitiveLens } from './cognitive-lenses';

/**
 * LENS GROUPS: Grouped contexts for 7 archetypal lens patterns
 * Covers 109 niches across all business categories
 * Each group has 3 context variants for variation in post generation
 */

export type LensGroupKey = 
  | 'GROUP_1_HIDDEN_UPSTREAM'
  | 'GROUP_2_EARLY_DECISION'
  | 'GROUP_3_TRADEOFF_CHOICE'
  | 'GROUP_4_HIDDEN_CONSTRAINT'
  | 'GROUP_5_DIVERGENCE'
  | 'GROUP_6_TIMING_MATTERS'
  | 'GROUP_7_SPECIALIZATION';

export interface LensGroupConfig {
  groupId: LensGroupKey;
  groupName: string;
  lenses: CognitiveLens[];
  description: string;
  mainContext: string;
  variants: {
    variant1: string;
    variant2: string;
    variant3: string;
  };
  nicheCount: number;
}

export const LENS_GROUPS: Record<LensGroupKey, LensGroupConfig> = {
  GROUP_1_HIDDEN_UPSTREAM: {
    groupId: 'GROUP_1_HIDDEN_UPSTREAM',
    groupName: 'Hidden Upstream Problem',
    lenses: ['Invisible Causality'],
    description: 'Symptom location ≠ cause location. The visible outcome is downstream from invisible upstream causes.',
    mainContext: `The underlying mechanism that determines outcomes but is never directly visible — the weakness, restriction, or imbalance upstream that manifests as pain, poor performance, or appearance changes downstream. The visible symptom location is rarely where the actual cause lives. Clients see where it hurts or what they don't like; you find what's actually driving it. Treating the symptom never works. Finding and addressing the invisible cause makes the symptom disappear.`,
    variants: {
      variant1: `The pain/problem location vs. the actual cause location — often three joints or systems away. The body shows you where it breaks down, not where the problem originated. A tight chest usually comes from weak back muscles. A weak ankle usually comes from hip instability three levels up. The shoulder problem is usually a thoracic spine problem wearing a shoulder label.`,
      variant2: `The hidden mechanism driving the visible outcome — weakness, restriction, imbalance, compensation pattern, or structural misalignment that determines everything downstream but isn't obvious until you look. Hair doesn't grow because circulation is poor. Performance doesn't improve because stabilizers are offline. Skin doesn't clear because the underlying hormonal or gut issue is unaddressed.`,
      variant3: `Why addressing the visible symptom never creates lasting change — because the real driver is invisible upstream. You can stretch a tight muscle a thousand times, but if weakness is causing the tightness, it'll return. You can apply topical solutions to skin, but if the root cause is internal, it'll persist. The symptom disappears only when you fix what's actually driving it.`
    },
    nicheCount: 22
  },

  GROUP_2_EARLY_DECISION: {
    groupId: 'GROUP_2_EARLY_DECISION',
    groupName: 'Early Decision Determines Downstream Potential',
    lenses: ['Latent Point', 'Tradeoff Lock'],
    description: 'Early choices lock in what\'s possible and impossible later. The latent point is before visible impact.',
    mainContext: `The early signal that determines long-term outcomes — the moment where future possibilities are effectively decided, even though nothing visible has changed yet. Early choices (ingredient selection, material specification, teaching method, design decision, neighborhood selection) lock in what's possible and what's impossible downstream. You can't change the choice later without massive cost or total failure. The decision made in the first hour determines what the final product can or cannot be.`,
    variants: {
      variant1: `The ingredient or material choice made at the beginning that determines everything downstream — water quality affects fermentation, pipe material affects lifespan, teaching method affects learning capacity. These early selections are nearly impossible to change once service begins. Choosing low-quality suppliers now means low-quality food all season. Choosing the right suppliers and ingredients early means quality locked in for months.`,
      variant2: `The early timing decision that determines what becomes possible — early intervention prevents problems; late intervention requires remediation. Early property purchase in up-and-coming neighborhood determines appreciation; late purchase misses the window. Early foundation work determines structural capacity; skipping it limits future potential. The moment you decide early or late determines everything that follows.`,
      variant3: `The design or approach decision made before work begins that locks in future capability — renovation approach determines how the space functions, teaching approach determines how students think, design choice determines what the space can accommodate. Once the decision is made and implemented, changing it requires starting over. The early choice determines not just quality but what's actually possible.`
    },
    nicheCount: 25
  },

  GROUP_3_TRADEOFF_CHOICE: {
    groupId: 'GROUP_3_TRADEOFF_CHOICE',
    groupName: 'Choosing One Benefit Means Accepting Specific Cost',
    lenses: ['Tradeoff Lock'],
    description: 'Every significant choice involves accepting a tradeoff. One choice locks you into its cost.',
    mainContext: `The early compromise that quietly determines what the system can and cannot handle later. Every significant choice involves accepting a specific tradeoff — speed vs. quality, cost vs. longevity, convenience vs. maintenance, aesthetics vs. durability. The choice made early locks you into that tradeoff for the entire project or product lifespan. You can't have both benefits; you choose one and accept the cost of the other.`,
    variants: {
      variant1: `Speed vs. quality tradeoff — quick solutions cost more to fix later. Premium solutions take longer but don't need replacement. Fast installation saves time but limits durability. Thorough approach takes more time but extends lifespan. The speed you choose early determines whether you'll be back doing this again in 2 years or 10 years.`,
      variant2: `Budget constraints lock you into longevity tradeoffs — cheap materials cost less upfront but require replacement sooner. Premium materials cost more now but function longer. Affordable solutions feel like wins until maintenance costs arrive. The budget chosen at the start determines the total cost of ownership over time.`,
      variant3: `Convenience choices lock in maintenance burden — low-maintenance options feel like wins until you realize they sacrifice beauty or capability. High-touch options provide results but demand ongoing attention. Automated systems need programming and monitoring. Manual systems need hands-on work. Choose convenience, accept less control. Choose capability, accept maintenance load.`
    },
    nicheCount: 18
  },

  GROUP_4_HIDDEN_CONSTRAINT: {
    groupId: 'GROUP_4_HIDDEN_CONSTRAINT',
    groupName: 'Hidden Constraint Determines What\'s Possible',
    lenses: ['Tradeoff Lock', 'Invisible Causality'],
    description: 'Hidden constraints determine capability. You can\'t exceed them without starting over.',
    mainContext: `The hidden constraint or structural decision that determines what is and isn't possible downstream. Regulatory constraints, technical architecture decisions, contract language, business structure, or early design choices create invisible limitations that determine what options are actually available later. You can't exceed these constraints without starting over. The constraint made at the beginning determines the ceiling of possibility for everything that follows. Some constraints are regulatory (unchangeable), some are technical (expensive to change), some are structural (nearly impossible to change).`,
    variants: {
      variant1: `Regulatory or legal constraints that lock in what's possible — business structure chosen determines tax options. Jurisdiction selected determines applicable laws. Contract language written determines what disputes are possible. These constraints aren't chosen lightly; changing them means unwinding everything. The early decision determines what's legally possible, period.`,
      variant2: `Technical decisions that become structural constraints — database architecture chosen determines query speeds forever. API design locked in determines integration possibilities. Infrastructure selected determines scalability ceiling. Change these, start from scratch. The technical choice made early becomes the constraint that determines performance and capability limits.`,
      variant3: `Structural decisions that determine available options — funding source chosen determines stakeholder influence. Partnership structure locked in determines profit distribution options. Early design decision constrains what modifications are possible. These aren't bad decisions; they're constraints that must be worked within. But they determine what the system can handle downstream.`
    },
    nicheCount: 11
  },

  GROUP_5_DIVERGENCE: {
    groupId: 'GROUP_5_DIVERGENCE',
    groupName: 'Identical Start, Different Path = Different Outcome',
    lenses: ['Divergence'],
    description: 'Same starting point, different teaching/coaching method = completely different outcomes.',
    mainContext: `Why two similar starting situations produce completely different outcomes under real use. Two students with the same initial ability level, two people with the same starting fitness, two clients with the same hair type or skin type — yet one path leads to mastery, confidence, and transformation while the other leads to frustration, injury, or failure. The difference isn't the starting point; it's the teaching method, coaching approach, environmental support, or individual attention provided along the way. Small differences in approach compound into completely different outcomes.`,
    variants: {
      variant1: `Why teaching method determines outcome — two students with identical abilities under different teaching approaches diverge completely. One gets structured, individualized feedback and develops deep understanding. Another gets generic instruction and develops surface-level skills that don't transfer. Same starting point. Different teaching. Completely different mastery level.`,
      variant2: `Why coaching quality determines outcome — two people with the same fitness level: good coaching creates sustainable progress and injury prevention. Poor coaching creates compensation patterns and eventual injury. Same body, same starting strength. Different coaching. One thrives, one breaks down.`,
      variant3: `Why environment and approach matter — two clients with the same condition (hair damage, skin type, flexibility level): one environment supports progress and confidence, another creates discouragement and abandonment. Identical starting point. Different environment. One becomes loyal regular, the other never returns.`
    },
    nicheCount: 12
  },

  GROUP_6_TIMING_MATTERS: {
    groupId: 'GROUP_6_TIMING_MATTERS',
    groupName: 'When It Happens Relative to Other Events',
    lenses: ['Latent Point'],
    description: 'Timing relative to a deadline determines what\'s possible. Early = options. Late = constraints.',
    mainContext: `The moment where outcomes are effectively decided, even though nothing visible has changed yet — the point in time before a major deadline or event when decisions made determine what becomes possible and what becomes impossible. Early booking provides options. Late booking eliminates them. Early preparation prevents crisis. Late preparation creates it. The timing of your decision relative to the event date determines quality, cost, options available, and stress level. There's a latent point before the event where decisions made still offer possibilities. Cross that point and the ceiling drops.`,
    variants: {
      variant1: `The booking moment relative to the event date determines what's available — early booking means vendor availability, custom options, competitive pricing. Late booking means limited vendors, premium pricing, compromised options. Six months early is a world of possibilities. Two weeks before is a constraint. The latent point is the moment when options start closing.`,
      variant2: `When preparation happens relative to conditions determines outcome — prepare before conditions change (frost, season change, deadline) and systems survive intact. Prepare after conditions have changed and damage is already done. Winterization in October prevents freeze damage. Winterization in January is crisis management. Same maintenance. Different timing. Different outcome.`,
      variant3: `When decisions are made relative to the deadline determines planning quality — early decisions allow contingency planning, vendor coordination, quality assurance. Late decisions eliminate these options. Plan an event 6 months out = careful execution. Plan 2 weeks out = hoping for luck. Same event. Different timing. Completely different stress and quality level.`
    },
    nicheCount: 7
  },

  GROUP_7_SPECIALIZATION: {
    groupId: 'GROUP_7_SPECIALIZATION',
    groupName: 'Deep Focus Creates Different Capability Than Generalist',
    lenses: ['Divergence', 'Invisible Causality'],
    description: 'Deep specialization creates different outcomes than generalist approach. Knowledge difference is invisible.',
    mainContext: `The hidden depth of knowledge that comes from deep specialization versus generalist approach. A specialist in one category has invisible expertise (technique, sourcing knowledge, selection criteria, understanding of subtlety) that creates completely different outcomes than a generalist. The specialist's deep focus creates capability the generalist can't match. This knowledge isn't obvious in the finished product until you experience the difference. A specialist ramen shop and a general noodle bar both serve noodles. The outcomes are completely different. A specialist florist and a grocery store both sell flowers. The customer experience is entirely different.`,
    variants: {
      variant1: `Deep technique knowledge from specialization — the specialist has 10 years of technique refinement in one thing. They understand subtleties (rice temperature, knife angle, aging times, color responses) that generalists don't know to consider. The difference isn't visible in the final product until you taste or experience it. Then it's obvious. Same ingredients. Different technique mastery. Completely different result.`,
      variant2: `Deep sourcing and selection knowledge from specialization — specialist knows where to source the best ingredients, how to select for quality, seasonal timing, supplier relationships. Generalist works with available suppliers. Specialist's sourcing creates ingredient quality that generalist can't match. Same market. Different knowledge. Different ingredient starting point. Different outcome.`,
      variant3: `Understanding subtle factors that determine quality — specialist knows what makes the difference (proportions, pacing, interaction effects, individual variation, seasonal change). Generalist follows standard approaches. Specialist's understanding of nuance creates experiences generalist can't replicate. Same basic category. Different depth of understanding. Completely different customer experience and result.`
    },
    nicheCount: 14
  }
};

/**
 * Helper function to get a specific lens group by key
 */
export function getLensGroup(groupId: LensGroupKey): LensGroupConfig {
  const group = LENS_GROUPS[groupId];
  if (!group) {
    throw new Error(`Lens group not found: ${groupId}`);
  }
  return group;
}

/**
 * Helper function to get a random variant from a lens group
 */
export function getRandomVariant(groupId: LensGroupKey): string {
  const group = getLensGroup(groupId);
  const variants = Object.values(group.variants);
  return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Helper function to get main context from a lens group
 */
export function getMainContext(groupId: LensGroupKey): string {
  const group = getLensGroup(groupId);
  return group.mainContext;
}
