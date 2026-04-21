export const NICHE_DATA: Record<string, string[]> = {
    "Health & Wellness": ["Dentist", "Physiotherapist", "Chiropractor", "Optometrist", "Pharmacist", "Family doctor", "Naturopath", "Massage therapist", "Nutritionist / dietitian", "Mental health therapist", "Acupuncturist", "Hearing clinic", "Orthodontist", "Dermatologist", "Medical aesthetics clinic"],
    "Home Services": ["Plumber", "Electrician", "HVAC / furnace repair", "Roofer", "Landscaper / lawn care", "Pest control", "House cleaner", "Painter", "General contractor", "Window & door installer", "Flooring installer", "Interior designer", "Moving company", "Home inspector", "Security systems"],
    "Food & Beverage": ["Café / coffee shop", "Restaurant", "Bakery", "Food truck", "Catering company", "Meal prep service", "Juice bar", "Butcher / deli", "Specialty grocery", "Dessert shop", "Brewery / winery", "Pizza shop", "Sushi / Asian restaurant", "Breakfast diner", "Vegan / health food café"],
    "Beauty & Personal Care": ["Hair salon", "Barbershop", "Nail salon", "Spa", "Waxing studio", "Eyebrow / lash studio", "Tattoo studio", "Tanning salon", "Makeup artist", "Esthetics school", "Permanent makeup clinic", "Microblading studio"],
    "Fitness & Recreation": ["Gym / fitness centre", "Yoga studio", "Pilates studio", "Boxing gym", "Crossfit / HIIT studio", "Personal trainer", "Dance studio", "Martial arts school", "Swimming school", "Rock climbing gym", "Cycling studio", "Golf course / driving range"],
    "Professional Services": ["Lawyer / law firm", "Accountant / CPA", "Financial advisor", "Insurance broker", "Mortgage broker", "Immigration consultant", "Business consultant", "Marketing agency", "Bookkeeper", "HR consultant", "IT support / MSP", "Notary public"],
    "Real Estate & Property": ["Realtor / real estate agent", "Property manager", "Condo management company", "Stager", "Home builder", "Real estate photographer", "Surveyor"],
    "Retail": ["Clothing boutique", "Shoe store", "Jewellery store", "Gift shop", "Bookstore", "Pet supply store", "Toy store", "Sporting goods store", "Electronics store", "Furniture store", "Florist", "Art gallery", "Vintage / thrift shop", "Cannabis dispensary"],
    "Automotive": ["Auto repair shop", "Car detailing", "Tire shop", "Auto body / collision", "Car wash", "Towing service", "Auto parts store", "EV charging installer"],
    "Education & Childcare": ["Daycare / nursery", "After-school program", "Tutoring centre", "Music school", "Art school / classes", "Language school", "Coding school for kids", "Driving school", "Test prep centre", "Early childhood centre"],
    "Events & Hospitality": ["Event planner", "Wedding photographer", "Videographer", "DJ / entertainment", "Florist (events)", "Venue rental", "Party supply rental", "Photo booth rental", "Catering (events)", "Hotel / B&B"],
    "Trades & Industrial": ["Welder", "Fabrication shop", "Industrial cleaning", "Waste removal / junk hauling", "Pool installation & service", "Septic service", "Snow removal", "Irrigation installer"],
    "Pets": ["Veterinarian", "Pet groomer", "Dog walker / pet sitter", "Pet boarding / kennel", "Dog trainer", "Aquarium store"],
    "Technology": ["Web design agency", "App developer", "IT consulting", "Computer repair", "Phone repair shop", "Smart home installer", "Cybersecurity firm", "Social media agency"]
  };

export const CATEGORIES = Object.keys(NICHE_DATA);
export const VOICES = ["The Expert", "The neighbour", "The Hustler", "The Minimalist"] as const;
export const POST_TYPES = ["5 Tips", "Promotion / offer", "Local event / news", "Myth-busting", "Behind the scenes"] as const;

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
}

