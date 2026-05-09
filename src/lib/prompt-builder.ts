// lib/prompt-builder.ts

import { getModeTemplate, PostType } from './mode-templates';


/**
 * PROMPT BUILDER
 * 
 * Takes variables from Supabase and the lens system,
 * selects the correct MODE template based on postType,
 * injects all variables, and returns a complete prompt ready for Haiku.
 */
const VOICE_PROMPTS: Record<string, string> = {
  "Authoritative & Precise": "Authoritative, factual, confident. Light industry terms. No exclamation marks. Trust through knowledge, not enthusiasm. Never use 'excited', 'thrilled', or 'delighted'. This is a style modifier — the post structure is defined separately.",
  "Warm & Conversational": "Warm, conversational, community-first. Friend-like tone. Use 'we' and 'you'. Non-corporate. Short sentences. Never ramble or hedge. This is a style modifier — the post structure is defined separately.",
  "Bold & Direct": "High-energy, direct, urgent. Short, punchy sentences. Bold claims. Drives immediate action. Sparse emphasis. This is a style modifier — the post structure is defined separately.",
  "Clean & Understated": "Clean, understated, sophisticated. Zero filler. Every sentence must earn its place. This is a style modifier — the post structure is defined separately.",
};

export interface ParsedBusinessIntel {
  neighbourhood?: string;
  landmarks?: string[];
  transit?: string[];
  local_trends?: string[];
  products_services?: string[];
  craft_identity?: string;
  description?: string;
  isInferred?: boolean;
}

export interface PromptBuilderConfig {
  // Core business info
  business_name: string;
  niche: string;
  fullAddress: string;
  
  // Lens system (from selectGroupAngle)
  lens: string;  // e.g., "Invisible Causality"
  lensDefinition: string;  // Random variant of lens
  groupContext: string;  // From group-angle-selector (replaces categoryContext)
  
  // Voice and generation
  voice: string;  // e.g., "Warm & Conversational"
  postType: PostType;  // Determines which MODE template
  
  // Optional variables
  recentHistory?: string;  // Recently used lenses
  varietyRules?: string;  // Constraints for variety
  
  // Context (time, weather, season)
  currentTime?: string;
  currentDate?: string;          // "May 9, 2026"  ← NEW
  currentWeather?: string;
  currentSeason?: string;
  
  // Business intelligence
  businessSummary?: string;
  businessIntel?: ParsedBusinessIntel;   // Structured parsed data

  event_or_shoutout?: string;
  
  offer_name?: string;
  offer_category?: string;
  whats_included?: string;
  available_timeframe?: string;
  eligibility?: string;
  offer_hook?: string;
  value_framing?: string;
}

function buildBusinessIntelSection(
  intel?: ParsedBusinessIntel, 
  summary?: string
): string {
  if (intel) {
    const parts: string[] = [];
    if (intel.neighbourhood) parts.push(`Neighbourhood: ${intel.neighbourhood}`);
    if (intel.landmarks?.length) parts.push(`Nearby: ${intel.landmarks.join(", ")}`);
    if (intel.transit?.length) parts.push(`Transit: ${intel.transit.join(", ")}`);
    if (intel.local_trends?.length) parts.push(`Vibe: ${intel.local_trends.join(", ")}`);
    if (intel.products_services?.length) parts.push(`Offerings: ${intel.products_services.join(", ")}`);
    if (intel.craft_identity) parts.push(`Craft: ${intel.craft_identity}`);
    if (intel.isInferred) parts.push("Note: Craft identity was inferred — use as background context only.");
    if (intel.description) parts.push(`Description: ${intel.description}`);
    
    return parts.length > 0 ? `[BUSINESS INTELLIGENCE]\n${parts.join("\n")}` : "";
  }
  return summary ? `${summary}` : "Standard business.";
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
}

/**
 * Build a complete prompt by:
 * 1. Selecting the MODE template based on postType
 * 2. Injecting all variables
 * 3. Handling optional variables gracefully
 * 
 * @param config - All variables needed for the prompt
 * @returns Complete prompt ready to send to Haiku
 */
export function buildPrompt(config: PromptBuilderConfig): string {
  // Step 1: Get the MODE template
  const template = getModeTemplate(config.postType);
  
  // Step 2: Get voice description text
  const voiceDescription = VOICE_PROMPTS[config.voice] || config.voice;

  const businessSection = buildBusinessIntelSection(config.businessIntel, config.businessSummary);
  
  // Step 3: Build variables object with all placeholders
  const variables: Record<string, string> = {
    business_name: config.business_name,
    niche: config.niche,
    fullAddress: config.fullAddress,
    lens: config.lens,
    lensDefinition: config.lensDefinition,
    groupContext: config.groupContext,  // Replaces categoryContext
    voice_description: voiceDescription,
    postType: config.postType,
    recentHistory: config.recentHistory || "None",
    varietyRules: config.varietyRules || "",
    current_time: config.currentTime || getCurrentTime(),
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
  
  // Step 4: Inject variables into template
  let prompt = template;
  
  // Replace all {{placeholder}} with corresponding values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    
    // Replace all occurrences of this placeholder
    // Use a regex to handle multiple occurrences
    prompt = prompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });
  
  // Step 5: Handle optional variables - remove any unused placeholders
  // This handles cases where a MODE doesn't use all variables
  prompt = prompt.replace(/{{[^}]+}}/g, '');
  
  return prompt;
}

/**
 * Helper: Get current time in readable format
 * Format: "2:30 PM, Tuesday"
 */
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

/**
 * Helper: Get current season
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

/**
 * Validate that all required variables are present
 * 
 * @param config - Configuration object
 * @throws Error if required variables are missing
 */
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

/**
 * Build prompt with validation
 * Throws error if required fields are missing
 * 
 * @param config - All variables needed for the prompt
 * @returns Complete prompt ready to send to Haiku
 */
export function buildPromptSafe(config: PromptBuilderConfig): string {
  validatePromptConfig(config);
  return buildPrompt(config);
}

/**
 * Helper type for extracting PostType values
 * Use like: type PT = PostTypeValue; // "Tip of the Day" | "Myth-busting" | ...
 */
export type PostTypeValue = PostType;
