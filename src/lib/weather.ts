const WMO_CODES: Record<number, string> = {
  0: "clear skies",
  1: "mostly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "icy fog",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  77: "snow grains",
  80: "rain showers",
  81: "heavy rain showers",
  82: "violent rain showers",
  85: "snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with heavy hail",
};

async function fetchWeatherAt(lat: number, lng: number, city: string): Promise<string> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&temperature_unit=celsius`,
  );
  const data = await res.json();
  const current = data.current;
  if (!current) return "";

  const description = WMO_CODES[current.weather_code as number] ?? "variable conditions";
  const temp = Math.round(current.temperature_2m);
  const feelsLike = Math.round(current.apparent_temperature);
  const feelsLikeText = temp !== feelsLike ? `, feels like ${feelsLike}°C` : "";

  return `${temp}°C${feelsLikeText}, ${description} in ${city}`;
}

/** Geocode city name then fetch current conditions (Open-Meteo). */
export async function fetchWeatherForCity(city: string): Promise<string> {
  const trimmed = city?.trim();
  if (!trimmed) return "";

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`,
    );
    const geoData = await geoRes.json();
    const loc = geoData.results?.[0];
    if (!loc) return "";

    return await fetchWeatherAt(loc.latitude, loc.longitude, trimmed);
  } catch {
    return "";
  }
}
