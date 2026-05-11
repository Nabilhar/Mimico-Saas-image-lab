//lib/constants

export const NICHE_DATA: Record<string, string[]> = {
    "Health & Wellness": ["Dentist", "Physiotherapist", "Chiropractor", "Optometrist", "Massage therapist", "Nutritionist / dietitian", "Acupuncturist", "Hearing clinic", "Orthodontist", "Dermatologist"],
    "Home Services": ["Plumber", "Electrician", "HVAC / furnace repair", "Smart home installer", "Roofer", "Landscaper / lawn care", "Pest control", "Window & door installer", "Flooring installer", "Interior designer", "Security systems"],
    "Food & Beverage": ["Café / coffee shop", "Tea shop / tea bar", "Restaurant", "Bakery", "Sushi restaurant", "Ramen shop / noodle bar", "Cheese shop / fromagerie", "Butcher / deli", "Dessert shop", "Pizza shop"],
    "Beauty & Personal Care": ["Hair salon", "Barbershop", "Nail salon", "Spa", "Medical aesthetics clinic", "Laser / skin clinic", "Tattoo studio", "Esthetics school", "Permanent makeup clinic"],
    "Fitness & Recreation": ["Gym / fitness centre", "Yoga studio", "Pilates studio", "Boxing gym", "Crossfit / HIIT studio", "Dance studio", "Martial arts school"],
    "Professional Services": ["Lawyer / law firm", "Accountant / CPA", "Financial advisor", "Insurance broker", "Mortgage broker", "Business consultant", "Social media agency", "HR consultant"],
    "Real Estate & Property": ["Realtor / real estate agent", "Stager", "Home builder"],
    "Retail": ["Clothing boutique", "Shoe store", "Jewellery store", "Bookstore", "Toy store", "Sporting goods store", "Specialty grocery", "Furniture store", "Florist"],
    "Automotive": ["Auto repair shop", "Car detailing", "Tire shop", "Auto body / collision", "Auto parts store"],
    "Education & Childcare": ["Daycare / nursery", "Tutoring centre", "Music school", "Art school / classes", "Language school", "Early childhood centre"],
    "Events & Hospitality": ["Event planner", "Venue rental", "Catering (events)", "Hotel / B&B"],
    "Trades & Industrial": ["Fabrication shop", "Industrial cleaning", "Pool installation & service", "Irrigation installer"],
    "Pets": ["Veterinarian", "Pet groomer", "Pet boarding / kennel"],
    "Technology": ["Web design agency", "App developer", "IT consulting", "Computer repair", "Cybersecurity firm"]
  };

export const CATEGORIES = Object.keys(NICHE_DATA);
export const VOICES = ["Authoritative & Precise", "Warm & Conversational", "Bold & Direct", "Clean & Understated"] as const;
export const POST_TYPES = ["Tip of the Day", "Promotion / offer", "Local event / news", "Myth-busting", "Behind the scenes", "Community moment"] as const;

export interface ColorTheme {
  primary: string;      // e.g., "#D4A574" or "Terracotta"
  secondary: string;    // e.g., "#FFFFFF" or "Cream"
  accent: string;       // e.g., "#2C3E50" or "Charcoal"
  description: string;  // e.g., "A warm, earthy palette of terracotta, cream, and charcoal"
}

export interface BusinessVisuals {
  logoColors: string;
  storefrontColors: string;
  interiorColors: string;
}

export interface BusinessIdentity {
  color_theme: ColorTheme | null;
  business_visuals: BusinessVisuals | null;
  storefront_architecture: any | null;
  interior_layout: string | null;
  brand_source: string | null; 
  business_description: string | null; 
  _stored_business_name?: string | null;
  _stored_street?: string | null;
  _stored_city?: string | null;
  last_analyzed_business_name?: string | null;
  last_analyzed_street?: string | null;
  last_analyzed_city?: string | null;
}

