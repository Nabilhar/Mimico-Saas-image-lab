// lib/cognitive-lenses.ts

/**
 * LAYER 1: UNIVERSAL COGNITIVE LENSES
 * Domain-agnostic causality primitives.
 * Each lens defines WHAT KIND OF TRUTH is being expressed.
 */

export const COGNITIVE_LENSES = {
    "Latent Point": {
      definition: "The moment where outcomes are effectively determined before anything visible changes",
      variants: [
        "The point where outcomes are effectively decided, even though nothing visible has changed yet",
        "The early stage where decisions quietly lock in all future constraints",
        "The moment where a system becomes irreversible in practice, even if it still looks flexible",
        "The stage where most downstream problems are actually introduced, not discovered",
      ]
    },
    
    "Tradeoff Lock": {
      definition: "The early compromise that silently defines all future behavior",
      variants: [
        "The early compromise that quietly determines what the system can and cannot handle later",
        "The decision where flexibility is exchanged for speed, cost, or simplicity",
        "The hidden constraint introduced early that shapes all future outcomes",
        "The point where optimizing one variable permanently limits another",
      ]
    },
    
    "Divergence": {
      definition: "Why similar starting conditions produce different outcomes over time",
      variants: [
        "Why two similar starting setups produce completely different outcomes under real use",
        "The small early difference that compounds into major separation over time",
        "Why identical inputs don't guarantee identical results in practice",
        "The subtle variable that determines whether performance converges or drifts apart",
      ]
    },
    
    "Invisible Causality": {
      definition: "The hidden mechanism that drives outcomes but is not directly observable",
      variants: [
        "The underlying mechanism that determines outcomes but is never directly visible",
        "What actually drives system behavior beneath the surface layer of appearances",
        "The constraint that shapes results without being explicitly configured anywhere",
        "The structural factor that explains outcomes better than any visible symptom",
      ]
    },
  } as const;
  
  export type CognitiveLens = keyof typeof COGNITIVE_LENSES;