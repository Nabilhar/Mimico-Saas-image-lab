"use client";

import { getFramework } from "@/lib/frameworks";
import { useState, useEffect, useRef } from "react";
import {
  persistHistory,
  MAX_HISTORY_ITEMS,
  type HistoryEntry,
} from "@/lib/postHistory";

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

export function GenerateDashboard() {
  // 1. Updated State Variables
  const [businessName, setBusinessName] = useState("Our Local Business");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Food & Beverage");
  const [voice, setVoice] = useState<(typeof VOICES)[number]>("The Neighbor");
  const [postType, setPostType] = useState<(typeof POST_TYPES)[number]>("5 Tips");
  
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  

// 1. Add this useEffect to "Auto-Fill" from the profile
useEffect(() => {
  // We check LocalStorage (where your Profile page saves its data)
  const savedProfile = localStorage.getItem("mimico_user_profile");
  
  if (savedProfile) {
    try {
      const profileData = JSON.parse(savedProfile);
      
      // If we find data, we update our state variables!
      if (profileData.businessName) setBusinessName(profileData.businessName);
      if (profileData.category) setCategory(profileData.category);
      if (profileData.voice) setVoice(profileData.voice);
      
      console.log("✅ Profile auto-loaded into Dashboard");
    } catch (e) {
      console.error("Failed to parse saved profile", e);
    }
  }
}, []); // The empty [] means this only runs ONCE when the page first loads

  function pushHistory(entry: HistoryEntry) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY_ITEMS);
      persistHistory(next);
      return next;
    });
  }

  // 2. Updated Save Logic
  function handleSaveToHistory() {
    if (!content) return;
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      category,
      voice,
      postType,
      content,
      savedAt: new Date().toISOString(),
    };
    pushHistory(entry);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  }

  function handleClearHistory() {
    if (history.length === 0) return;
    
    // A friendly browser alert to prevent accidental clicks
    if (!window.confirm("Are you sure? This will permanently delete all saved Mimico posts from this browser.")) {
      return;
    }
  
    // 1. Clear the screen (State)
    setHistory([]);
    
    // 2. Clear the "Locker" (LocalStorage)
    persistHistory([]); 
    
    console.log("🗑️ History wiped clean");
  }

  // 3. Updated Generate Logic (Sending the new variables)
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
            framework // 2. SEND THE FRAMEWORK TO THE API!
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setContent(data.content);
    } catch (err: Error | any) {
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
          {/* Business Name */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Business Name</label>
            <input 
              className="mt-1 w-full p-3 border rounded-xl"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. SanRemo Bakery"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Business Category</label>
            <select 
              className="mt-1 w-full p-3 border rounded-xl bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Voice */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Brand Voice</label>
            <select 
              className="mt-1 w-full p-3 border rounded-xl bg-white"
              value={voice}
              onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
            >
              {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Post Type */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Post Style</label>
            <select 
              className="mt-1 w-full p-3 border rounded-xl bg-white"
              value={postType}
              onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
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

        {/* Output Display */}
        {content && (
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-cyan-700">{category} · {voice}</span>
               <button onClick={handleSaveToHistory} className="text-xs bg-white border px-3 py-1 rounded-lg">
                 {savedFeedback ? "Saved!" : "Save to History"}
               </button>
            </div>
          {/* The Content */}
       
           <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">{content}</p>
          
           {/* --- CHARACTER LIMIT TRACKER --- */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Instagram Limit
                  </span>
                  <span className={`text-sm font-mono ${content.length > 2200 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                    {content.length.toLocaleString()} / 2,200
                  </span>
                </div>
                
                {content.length > 2200 ? (
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase animate-pulse">
                    Too Long
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold uppercase">
                    Good to Post
                  </span>
                )}
              </div>
          </div>
        )}
    
      {/* History List */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
        
      {/* --- NEW HEADER SECTION --- */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-slate-900">Saved Posts</h3>
    
    {/* Only show the button if there are actually posts to clear */}
    {history.length > 0 && (
      <button 
        onClick={handleClearHistory}
        className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
      >
        Clear All
      </button>
    )}
  </div>
  {/* -------------------------- */}

  <ul className="space-y-4">
    {history.length === 0 ? (
      <p className="text-sm text-slate-400 text-center py-4">No saved posts yet.</p>
    ) : (
      history.map((entry) => (
        <li key={entry.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-2">
            {entry.category} ({entry.voice}) · {new Date(entry.savedAt).toLocaleDateString()}
          </p>
          <p className="text-sm line-clamp-3 text-slate-700">{entry.content}</p>
        </li>
      ))
    )}
  </ul>
</div>
      </div>
    </div>
  );
}