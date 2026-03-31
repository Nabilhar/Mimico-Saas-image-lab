"use client";

import { getFramework } from "@/lib/frameworks";
import { useState, useEffect } from "react";

// Added the missing interface
interface GenerateDashboardProps {
  onGenerateSuccess?: (content: string) => void;
}

const CATEGORIES = [
  "Health & Wellness", "Home Services", "Automotive", "Trades & Industrial",
  "Food & Beverage", "Beauty & Personal Care", "Fitness & Recreation", 
  "Retail", "Pets", "Events & Hospitality", "Professional Services", 
  "Real Estate & Property", "Education & Childcare", "Technology"
] as const;

const VOICES = ["The Expert", "The Neighbor", "The Hustler", "The Minimalist"] as const;

const POST_TYPES = [
  "5 Tips", "Promotion / offer", "Local event / news", "Myth-busting", "Behind the scenes"
] as const;

export function GenerateDashboard({ onGenerateSuccess }: GenerateDashboardProps) {
  const [businessName, setBusinessName] = useState("Our Local Business");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Food & Beverage");
  const [voice, setVoice] = useState<(typeof VOICES)[number]>("The Neighbor");
  const [postType, setPostType] = useState<(typeof POST_TYPES)[number]>("5 Tips");
  
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("mimico_business_profile");
    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        if (profileData.businessName) setBusinessName(profileData.businessName);
        if (profileData.category) setCategory(profileData.category as any);
        if (profileData.voice) setVoice(profileData.voice as any);
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    }
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setContent(null);

    const framework = getFramework(category, postType, voice);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Generate a ${postType} post for ${businessName}`,
          category, 
          postType, 
          voice, 
          businessName,
          framework 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      const generatedContent = data.content;
      setContent(generatedContent);

      if (onGenerateSuccess) {
        onGenerateSuccess(generatedContent);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Mimico Content AI</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Business Name</label>
            <input 
              className="mt-1 w-full p-3 border rounded-xl"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. SanRemo Bakery"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Business Category</label>
            <select 
              className="mt-1 w-full p-3 border rounded-xl bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Brand Voice</label>
            <select 
              className="mt-1 w-full p-3 border rounded-xl bg-white"
              value={voice}
              onChange={(e) => setVoice(e.target.value as any)}
            >
              {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Post Style</label>
            <select 
              className="mt-1 w-full p-3 border rounded-xl bg-white"
              value={postType}
              onChange={(e) => setPostType(e.target.value as any)}
            >
              {POST_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !businessName}
            className="w-full bg-cyan-800 text-white font-bold py-4 rounded-xl hover:bg-cyan-900 transition disabled:opacity-50"
          >
            {loading ? "Crafting your post..." : "Generate Mimico Post"}
          </button>
        </div>

        {content && (
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-cyan-700">Result: {postType}</span>
              <span className="text-[10px] text-slate-400 italic">Saved to dashboard automatically</span>
            </div>
            <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">{content}</p>
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Instagram Limit</span>
                <span className={`text-sm font-mono ${content.length > 2200 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                  {content.length.toLocaleString()} / 2,200
                </span>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${content.length > 2200 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                {content.length > 2200 ? 'Too Long' : 'Good to Post'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}