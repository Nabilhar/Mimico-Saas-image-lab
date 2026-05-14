// lib/timezone.ts
import { formatInTimeZone } from 'date-fns-tz';

export const CITY_TIMEZONE_MAP: Record<string, string> = {
  // Ontario
  "Toronto": "America/Toronto",
  "Ottawa": "America/Toronto",
  "Mississauga": "America/Toronto",
  "Hamilton": "America/Toronto",
  "London": "America/Toronto",
  "Kitchener": "America/Toronto",
  
  // Quebec
  "Montreal": "America/Toronto",
  "Quebec City": "America/Toronto",
  "Laval": "America/Toronto",
  "Gatineau": "America/Toronto",
  
  // British Columbia
  "Vancouver": "America/Vancouver",
  "Victoria": "America/Vancouver",
  "Kelowna": "America/Vancouver",
  "Surrey": "America/Vancouver",
  "Richmond": "America/Vancouver",
  "Burnaby": "America/Vancouver",
  
  // Alberta
  "Calgary": "America/Edmonton",
  "Edmonton": "America/Edmonton",
  "Red Deer": "America/Edmonton",
  "Lethbridge": "America/Edmonton",
  
  // Manitoba
  "Winnipeg": "America/Winnipeg",
  "Brandon": "America/Winnipeg",
  
  // Saskatchewan (no DST)
  "Regina": "America/Regina",
  "Saskatoon": "America/Regina",
  
  // Nova Scotia
  "Halifax": "America/Halifax",
  "Dartmouth": "America/Halifax",
  
  // New Brunswick
  "Moncton": "America/Moncton",
  "Saint John": "America/Moncton",
  "Fredericton": "America/Moncton",
  
  // Newfoundland & Labrador
  "St. John's": "America/St_Johns",
  
  // Prince Edward Island
  "Charlottetown": "America/Halifax",
};

export function getTimezoneForCity(city: string): string {
  const normalizedCity = city?.trim();
  return CITY_TIMEZONE_MAP[normalizedCity] || "America/Toronto";
}

export interface BusinessTime {
  time: string;        // "4:30 PM"
  date: string;        // "Wednesday, May 14, 2026"
  day: string;         // "Wednesday"
  hour: number;        // 16 (24-hour format)
  month: string;       // "May"
  isoString: string;   // For logging/debugging
}

export function getBusinessTime(timezone: string): BusinessTime {
  const now = new Date();
  
  return {
    time: formatInTimeZone(now, timezone, 'h:mm a'),
    date: formatInTimeZone(now, timezone, 'EEEE, MMMM d, yyyy'),
    day: formatInTimeZone(now, timezone, 'EEEE'),
    hour: parseInt(formatInTimeZone(now, timezone, 'H')),
    month: formatInTimeZone(now, timezone, 'MMMM'),
    isoString: now.toISOString(),
  };
}

export interface TimeOfDayContext {
  period: string;
  lightQuality: string;
  servicePhase: string;
}

export function getTimeOfDayContext(timezone: string): TimeOfDayContext {
  const hour = parseInt(formatInTimeZone(new Date(), timezone, 'H'));
  
  if (hour >= 5 && hour < 12) {
    return {
      period: "morning",
      lightQuality: "morning light",
      servicePhase: "prep",
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      period: "afternoon",
      lightQuality: "afternoon light",
      servicePhase: "lunch service",
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      period: "evening",
      lightQuality: "evening light",
      servicePhase: "dinner service",
    };
  } else {
    return {
      period: "night",
      lightQuality: "night",
      servicePhase: "cleanup/prep",
    };
  }
}