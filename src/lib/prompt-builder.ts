// lib/prompt-builder.ts - REFACTORED VERSION
// Instead of building everything then stripping, we build only what each mode needs

import { getModeTemplate, PostType } from './mode-templates';
import { VOICE_PROMPTS } from "@/lib/VOICE_PROMPTS";

export interface ParsedBusinessIntel {
  neighbourhood?: string;
  landmarks?: string[];
  transit?: string[];
  local_trends?: string[];
  products_services?: string[];
  craft_identity?: string;
  description?: string;
  isInferred?: boolean;

  interior_layout?: {
    counter_position?: string;
    seating_style_density?: string;
    open_plan_or_divided_spaces?: string;
    lighting_mood?: string;
    distinctive_design_feature?: string;
  };
  storefront_architecture?: {
    building?: {
      door?: string;
      stories?: string;
      material?: string;
      window_type?: string;
      facade_style?: string;
    };
    features?: {
      patio?: string;
      planters?: string;
      corner_unit?: string;
      street_furniture?: string;
    };
  };
}

export interface PromptBuilderConfig {
  business_name: string;
  niche: string;
  fullAddress: string;
  lens: string;
  lensDefinition: string;
  groupContext: string;
  voice: string;
  postType: PostType;
  recentHistory?: string;
  varietyRules?: string;
  currentTime?: string;
  currentDay?: string;
  currentDate?: string;
  currentWeather?: string;
  currentSeason?: string;
  businessSummary?: string;
  businessIntel?: ParsedBusinessIntel;
  event_or_shoutout?: string;
  offer_name?: string;
  offer_category?: string;
  whats_included?: string;
  available_timeframe?: string;
  eligibility?: string;
  offer_hook?: string;
  value_framing?: string;
}

/**
 * MODE-SPECIFIC DATA REQUIREMENTS
 * Defines exactly what data each mode category needs
 */
const MODE_DATA_REQUIREMENTS = {
  // EDUCATION modes: Focus on expertise and process
  EDUCATION: {
    modes: ['Myth-busting', 'Tip of the Day'],
    needs: {
      craft_identity: true,
      products_services: true,
      description: true,
      neighbourhood: true,
      landmarks: true,
      transit: true,
      local_trends: true,
      interior_layout: true,
      storefront_architecture: false,
    }
  },
  
  // OBSERVATION modes: Physical space and operations matter
  OBSERVATION: {
    modes: ['Behind the scenes', 'Promotion / offer'],
    needs: {
      craft_identity: true,
      products_services: true,
      description: true,
      neighbourhood: true,
      landmarks: true,
      transit: false,
      local_trends: true,
      interior_layout: true,      // ✅ Needs interior details
      storefront_architecture: true, // ✅ Needs storefront details
    }
  },
  
  // COMMUNITY modes: Location and neighbourhood context
  COMMUNITY: {
    modes: ['Local event / news', 'Community moment'],
    needs: {
      craft_identity: true,
      products_services: false,
      description: true,
      neighbourhood: true,
      landmarks: true,
      transit: true,
      local_trends: true,
      interior_layout: false,     // ❌ Don't need interior
      storefront_architecture: false, // ❌ Don't need storefront
    }
  },
};

/**
 * Get the data requirements for a specific post type
 */
function getDataRequirements(postType: string) {
  for (const [category, config] of Object.entries(MODE_DATA_REQUIREMENTS)) {
    if (config.modes.includes(postType)) {
      return config.needs;
    }
  }
  // Default: include everything (safest fallback)
  return {
    craft_identity: true,
    products_services: true,
    description: true,
    neighbourhood: true,
    landmarks: true,
    transit: true,
    local_trends: true,
    interior_layout: true,
    storefront_architecture: true,
  };
}

/**
 * Build business intelligence section based on MODE requirements
 * NO STRIPPING - we build only what's needed from the start
 */
function buildBusinessIntelSection(
  intel?: ParsedBusinessIntel, 
  postType?: string 
): string {
  if (!intel || !postType) return "";

  const needs = getDataRequirements(postType);
  const parts: string[] = [];

  // Core business info (almost always needed)
  if (needs.craft_identity && intel.craft_identity) {
    parts.push(`Craft: ${intel.craft_identity}`);
  }
  
  if (intel.isInferred) {
    parts.push("Note: Craft identity was inferred — use as background context only.");
  }
  
  if (needs.description && intel.description) {
    parts.push(`Description: ${intel.description}`);
  }

  if (needs.products_services && intel.products_services?.length) {
    parts.push(`Offerings: ${intel.products_services.join(", ")}`);
  }

  // Location context (conditional)
  if (needs.neighbourhood && intel.neighbourhood) {
    parts.push(`Neighbourhood: ${intel.neighbourhood}`);
  }

  if (needs.landmarks && intel.landmarks?.length) {
    parts.push(`Nearby: ${intel.landmarks.join(", ")}`);
  }

  if (needs.transit && intel.transit?.length) {
    parts.push(`Transit: ${intel.transit.join(", ")}`);
  }

  if (needs.local_trends && intel.local_trends?.length) {
    parts.push(`Vibe: ${intel.local_trends.join(", ")}`);
  }

  // Physical space details (only for OBSERVATION modes)
  if (needs.interior_layout && intel.interior_layout) {
    const interiorParts: string[] = [];
    
    if (intel.interior_layout.distinctive_design_feature) {
      interiorParts.push(`Layout: ${intel.interior_layout.distinctive_design_feature}`);
    }
    if (intel.interior_layout.lighting_mood) {
      interiorParts.push(`Lighting: ${intel.interior_layout.lighting_mood}`);
    }
    if (intel.interior_layout.seating_style_density) {
      interiorParts.push(`Seating: ${intel.interior_layout.seating_style_density}`);
    }
    if (intel.interior_layout.open_plan_or_divided_spaces) {
      interiorParts.push(`Space: ${intel.interior_layout.open_plan_or_divided_spaces}`);
    }
    
    if (interiorParts.length > 0) {
      parts.push(`\n[INTERIOR DETAILS]\n${interiorParts.join("\n")}`);
    }
  }

  if (needs.storefront_architecture && intel.storefront_architecture) {
    const storefrontParts: string[] = [];
    
    if (intel.storefront_architecture.building?.facade_style) {
      storefrontParts.push(`Facade: ${intel.storefront_architecture.building.facade_style}`);
    }
    if (intel.storefront_architecture.building?.door) {
      storefrontParts.push(`Entrance: ${intel.storefront_architecture.building.door}`);
    }
    if (intel.storefront_architecture.features?.patio) {
      storefrontParts.push(`Patio: ${intel.storefront_architecture.features.patio}`);
    }
    if (intel.storefront_architecture.features?.planters) {
      storefrontParts.push(`Landscaping: ${intel.storefront_architecture.features.planters}`);
    }
    
    if (storefrontParts.length > 0) {
      parts.push(`\n[STOREFRONT]\n${storefrontParts.join("\n")}`);
    }
  }

  return parts.length > 0 ? `[BUSINESS INTELLIGENCE]\n${parts.join("\n")}` : "";
}

function getCurrentDay(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
}

function getCurrentTime(): string {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  return `${time}, ${day}`;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

/**
 * Build a complete prompt by selecting the MODE template and injecting variables
 */
export function buildPrompt(config: PromptBuilderConfig): string {
  const template = getModeTemplate(config.postType);
  const voiceDescription = VOICE_PROMPTS[config.voice] || config.voice;
  
  // Build ONLY what this mode needs
  const businessSection = buildBusinessIntelSection(config.businessIntel, config.postType);
  
  const variables: Record<string, string> = {
    business_name: config.business_name,
    niche: config.niche,
    fullAddress: config.fullAddress,
    lens: config.lens,
    lensDefinition: config.lensDefinition,
    groupContext: config.groupContext,
    voice_description: voiceDescription,
    postType: config.postType,
    recentHistory: config.recentHistory || "None",
    varietyRules: config.varietyRules || "",
    current_time: config.currentTime || getCurrentTime(),
    current_day: config.currentDay || getCurrentDay(), 
    current_date: config.currentDate || getCurrentDate(),
    current_weather: config.currentWeather || "Unknown",
    current_season: config.currentSeason || getCurrentSeason(),
    business_summary: businessSection,
    event_or_shoutout: config.event_or_shoutout || "",
    offer_name: config.offer_name || "",
    offer_category: config.offer_category || "",
    whats_included: config.whats_included || "",
    available_timeframe: config.available_timeframe || "",
    eligibility: config.eligibility || "",
    offer_hook: config.offer_hook || "",
    value_framing: config.value_framing || "",
  };
  
  let prompt = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    prompt = prompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });
  
  // Remove unused placeholders
  prompt = prompt.replace(/{{[^}]+}}/g, '');
  
  return prompt;
}

export function validatePromptConfig(config: PromptBuilderConfig): void {
  const required = [
    'business_name',
    'niche',
    'fullAddress',
    'lens',
    'lensDefinition',
    'groupContext',
    'voice',
    'postType',
  ];
  
  for (const field of required) {
    if (!config[field as keyof PromptBuilderConfig]) {
      throw new Error(`Missing required field in PromptBuilderConfig: ${field}`);
    }
  }
}

export function buildPromptSafe(config: PromptBuilderConfig): string {
  validatePromptConfig(config);
  return buildPrompt(config);
}

export type PostTypeValue = PostType;