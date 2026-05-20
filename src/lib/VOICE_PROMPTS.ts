// Updated VOICE_PROMPTS with neighborhood integration across all voices

export const VOICE_PROMPTS: Record<string, string> = {
  "Authoritative & Precise": 
    "Authoritative, factual, confident. Light industry terms. No exclamation marks. Trust through knowledge, not enthusiasm. Rarely use 'excited', 'thrilled', or 'delighted'. Clean, direct sentences. No hedging. Clinical precision without coldness.",
  
  "Warm & Conversational": 
    "Warm, conversational, friend-to-friend. Use 'we' and 'you'. Acknowledge common struggles with empathy ('I know...', 'We all...', 'It's tempting to...'). Non-corporate, neighborhood voice. Varied sentence length—short for emphasis, longer for explanation. Conversational flow.",
  
  "Bold & Direct": 
    "High-energy, direct, urgent. Challenge assumptions. Short, punchy sentences. Bold claims without apology. Drives immediate action. Not educational—motivational. Make them feel the stakes. Sparse emphasis—let the words carry weight.",
  
  "Clean & Understated": 
    "Clean, understated, sophisticated. Zero filler. Every sentence must earn its place. Longer, elegant sentences when they serve clarity. Sophistication through restraint, not coldness. Breathing room in pacing.",
};

export const VOICE_EMOJI_GUIDANCE: Record<string, string> = {
  "Authoritative & Precise": 
    "Emojis: Minimal. Use only if emphasizing a key metric or concept . Never decorative or playful. Often better without.",
  
  "Warm & Conversational": 
    "Emojis: Welcome for warmth . Avoid aggressive symbols (🔪 ⚔️ 💥). Match the mood: supportive, not hype.",
  
  "Bold & Direct": 
    "Emojis: High-energy allowed. But avoid violence metaphors (🔪 💣 ⚔️). Use for emphasis, not decoration.",
  
  "Clean & Understated": 
    "Emojis: Rare or none. If used, subtle and intentional. Restraint is the aesthetic.",
};

/**
 * USAGE NOTES:
 * 
 * All voices now include guidance on local context integration:
 * 
 * - Authoritative: Uses location to establish credibility/authority
 * - Warm: Uses location to create personal, community connection
 * - Bold: Uses location to create urgency or raise stakes
 * - Clean: Uses location subtly to anchor authority
 * 
 * The key phrase in each: "when it adds credibility/personal/stakes/authority"
 * This prevents forced insertion—only when it serves the voice's purpose.
 * 
 * Business intel includes:
 * - business_name
 * - neighbourhood
 * - landmarks
 * - fullAddress (street, city)
 * 
 * Model will naturally select appropriate references based on voice personality.
 */
