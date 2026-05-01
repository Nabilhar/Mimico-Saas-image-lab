//lib/constants

export const NICHE_DATA: Record<string, string[]> = {
    "Health & Wellness": ["Dentist", "Physiotherapist", "Chiropractor", "Optometrist", "Naturopath", "Massage therapist", "Nutritionist / dietitian", "Mental health therapist", "Acupuncturist", "Hearing clinic", "Orthodontist", "Dermatologist"],
    "Home Services": ["Plumber", "Electrician", "HVAC / furnace repair", "Smart home installer", "Roofer", "Landscaper / lawn care", "Pest control", "House cleaner", "Painter", "General contractor", "Window & door installer", "Flooring installer", "Interior designer", "Moving company", "Home inspector", "Security systems"],
    "Food & Beverage": ["Café / coffee shop", "Tea shop / tea bar", "Restaurant", "Bakery", "Sushi restaurant", "Ramen shop / noodle bar", "Cheese shop / fromagerie", "Meal prep service", "Juice bar", "Butcher / deli", "Specialty grocery", "Dessert shop", "Pizza shop", "Sushi / Asian restaurant", "Breakfast diner", "Vegan / health food café"],
    "Beauty & Personal Care": ["Hair salon", "Barbershop", "Nail salon", "Spa", "Medical aesthetics clinic", "Laser / skin clinic", "Waxing studio", "Eyebrow / lash studio", "Tattoo studio", "Tanning salon", "Esthetics school", "Permanent makeup clinic"],
    "Fitness & Recreation": ["Gym / fitness centre", "Yoga studio", "Pilates studio", "Boxing gym", "Crossfit / HIIT studio", "Dance studio", "Martial arts school", "Swimming school", "Rock climbing gym", "Cycling studio", "Golf course / driving range"],
    "Professional Services": ["Lawyer / law firm", "Accountant / CPA", "Financial advisor", "Insurance broker", "Mortgage broker", "Immigration consultant", "Business consultant", "Marketing agency", "HR consultant", "Notary public"],
    "Real Estate & Property": ["Realtor / real estate agent", "Property manager", "Condo management company", "Stager", "Home builder", "Surveyor"],
    "Retail": ["Clothing boutique", "Shoe store", "Jewellery store", "Gift shop", "Bookstore", "Toy store", "Sporting goods store", "Supplement / nutrition store", "Electronics store", "Furniture store", "Florist", "Art gallery", "Vintage / thrift shop"],
    "Automotive": ["Auto repair shop", "Car detailing", "Tire shop", "Auto body / collision", "Car wash", "Auto parts store", "EV charging installer"],
    "Education & Childcare": ["Daycare / nursery", "After-school program", "Tutoring centre", "Music school", "Art school / classes", "Language school", "Coding school for kids", "Driving school", "Test prep centre", "Early childhood centre"],
    "Events & Hospitality": ["Event planner", "Venue rental", "Party supply rental", "Catering (events)", "Hotel / B&B"],
    "Trades & Industrial": ["Welder", "Fabrication shop", "Industrial cleaning", "Waste removal / junk hauling", "Pool installation & service", "Snow removal", "Irrigation installer"],
    "Pets": ["Veterinarian", "Pet groomer", "Pet boarding / kennel", "Dog trainer", "Aquarium store"],
    "Technology": ["Web design agency", "App developer", "IT consulting", "Computer repair", "Phone repair shop", "Cybersecurity firm", "Social media agency"]
  };

export const CATEGORIES = Object.keys(NICHE_DATA);
export const VOICES = ["Authoritative & Precise", "Warm & Conversational", "Bold & Direct", "Clean & Understated"] as const;
export const POST_TYPES = ["5 Tips", "Promotion / offer", "Local event / news", "Myth-busting", "Behind the scenes", "Community moment"] as const;

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

