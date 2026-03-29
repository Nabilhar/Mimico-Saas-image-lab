import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const NICHES = ["Dentist", "Realtor", "Cafe"] as const;
const POST_TYPES = ["5 Tips", "Myth-Buster"] as const;

type Niche = (typeof NICHES)[number];
type PostType = (typeof POST_TYPES)[number];

function isNiche(v: string): v is Niche {
  return (NICHES as readonly string[]).includes(v);
}

function isPostType(v: string): v is PostType {
  return (POST_TYPES as readonly string[]).includes(v);
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY. Add it to .env.local." },
      { status: 500 }
    );
  }

  let body: { niche?: string; postType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const niche = body.niche ?? "";
  const postType = body.postType ?? "";

  if (!isNiche(niche) || !isPostType(postType)) {
    return NextResponse.json(
      { error: "Invalid niche or post type." },
      { status: 400 }
    );
  }


  const prompt = `
You are a local marketing expert in Mimico and South Etobicoke.
Write ONE Instagram-ready caption for a ${niche} in this area.
The content style must match: "${postType}".

Current Local Context (March 2026):
- Mention the ongoing revitalization near the Mimico GO Station if relevant to growth/business.
- If mentioning the outdoors, reference the "Humber Bay Park West" shoreline maintenance or the "Waterfront Trail" extension.
- Mention local favorite spots like SanRemo Bakery (known for being busy/sold out of fritters) or the Royal York Meat Market as community touchpoints.
- Tone: Professional, neighborly, and proud of the "Beach of the West End" vibe.

Instagram formatting (critical — output must paste as-is):
- Use clear line breaks: short paragraphs separated by blank lines (double newline). No wall of text.
- Structure suggestion: (1) hook line with one emoji, (2) blank line, (3) main body with bullets or numbered lines if "5 Tips" or myth setup + debunk for "Myth-Buster", (4) blank line, (5) optional short CTA line, (6) blank line, (7) 3 hashtags on their own last line: #Mimico #SouthEtobicoke #ShopLocalTO (adjust wording only if a different niche needs a more specific third tag, but keep exactly 3 hashtags).
- Include exactly 3 to 5 relevant emojis total, placed naturally (hook, section breaks, or bullet lines). No emoji spam; choose emojis that match the niche and message.
- Do not wrap the caption in quotes. Do not add a title like "Caption:" or "Post:". Output only the caption text.

Rules:
1. Use 2026 trends: emphasize "Support Local" and "Locally Sourced" values where fitting.
2. If it's a "5 Tips" post, use five numbered lines (1.–5.) with one tip per line, each line break after the tip for readability.
3. If it's a "Myth-Buster", use a bold-feeling hook line, blank line, myth in one short line, blank line, truth/debunk in short paragraphs with line breaks.
`;


  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from the model." },
        { status: 502 }
      );
    }

    return NextResponse.json({ content: text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
