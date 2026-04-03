"use client";

import { getFramework, FRAMEWORK_DEFINITIONS } from "@/lib/frameworks";
import { useState, useEffect, useRef } from "react"; 
import { VOICES } from "@/lib/constants";

interface GenerateDashboardProps {
  onGenerateSuccess?: (content: string) => void;
  onShare: (content: string) => void;
}

export function GenerateDashboard({ onGenerateSuccess, onShare }: GenerateDashboardProps) {
  // 1. Create the Ref
  const saveRef = useRef(onGenerateSuccess);
  const [business_name, setbusiness_name] = useState("Our Local Business");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Food & Beverage");
  const [niche, setNiche] = useState("");
  const [voice, setVoice] = useState("The Neighbor");
  const [postType, setPostType] = useState("PAS");
  
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    saveRef.current = onGenerateSuccess;
  }, [onGenerateSuccess]);

  const loadingPhases = [
    "Locating address...",
    "Identifying local landmarks...",
    "Researching neighborhood trends...",
    "Applying strategy...",
    "Polishing owner voice...",
    "Finalizing post..."
  ];

  // 1. Load Profile from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("mimico_business_profile");
    if (saved) {
      const data = JSON.parse(saved);
      setbusiness_name(data.business_name || "");
      setLocation(data.location || "");
      setCategory(data.category || "Food & Beverage");
      setNiche(data.niche || "");
      setVoice(data.voice || "The Neighbor");
      
    }
  }, []);

  // 2. The Loading Bar Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let i = 0;
      setStatus(loadingPhases[0]);
      interval = setInterval(() => {
        i++;
        if (i < loadingPhases.length) setStatus(loadingPhases[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const selectedFramework = getFramework(category, postType, voice);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  async function handleGenerate() {
    setLoading(true);
    setContent(null);

    const instructions = FRAMEWORK_DEFINITIONS[selectedFramework];

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Generate a ${postType} post for ${business_name}`,
          category, niche, postType, voice, business_name, location, instructions
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        const cleanPost = data.content.replace(/<research>[\s\S]*?<\/research>/g, "").trim();
        setContent(cleanPost);

        //****added for debug */
        console.log("DEBUG: Calling onGenerateSuccess with:", cleanPost); // <--- ADD THIS
        // ************ end of debug
        // Wrap this in a timeout to let the UI breathe
  setTimeout(() => {
    if (saveRef.current) {
      console.log("DEBUG: saveRef is firing!");
      saveRef.current(cleanPost);
    } else {
      console.error("DEBUG ERROR: saveRef.current is still undefined. Check the Dashboard props!");
    }
  }, 500);

      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Mimico Content AI</h2>
        
        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Business Name</label>
            <input className="mt-1 w-full p-3 border rounded-xl bg-slate-50 text-slate-500 outline-none" value={business_name} readOnly />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Brand Voice</label>
            <select className="mt-1 w-full p-3 border rounded-xl bg-white" value={voice} onChange={(e) => setVoice(e.target.value)}>
              {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Post Style</label>
            <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full p-3 border rounded-xl">
              <option value="PAS">PAS (Problem-Agitation-Solution)</option>
              <option value="BAB">BAB (Before-After-Bridge)</option>
              <option value="AIDA">AIDA (Attention-Interest-Desire-Action)</option>
            </select>
          </div>

          {/* --- THE LOADING BAR UI --- */}
          {loading && (
            <div className="mt-6 p-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-lg animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-cyan-400 rounded-full animate-ping" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Local Research Agent</span>
                  <span className="text-sm text-cyan-100 font-medium">{status}</span>
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-1000 ease-linear" 
                  style={{ width: `${((loadingPhases.indexOf(status) + 1) / loadingPhases.length) * 100}%` }} 
                />
              </div>
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-cyan-800 text-white font-bold py-4 rounded-xl hover:bg-cyan-900 transition disabled:opacity-50"
          >
            {loading ? "Crafting..." : "Generate Mimico Post"}
          </button>
        </div>
        

        {/* --- THE RESULT AREA (Includes Copy & Instagram Check) --- */}
        {content && (
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-cyan-700">Result: {postType}</span>
                <span className="text-[10px] text-slate-400 italic">Saved to dashboard automatically</span>
              </div>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={handleCopy}
                  className={`text-[11px] font-bold uppercase px-4 py-2 rounded-xl bg-cyan-100 text-cyan-700 border border-cyan-200 hover:bg-cyan-200 transition-all shadow-sm" ${
                    copied 

                  }`}
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
                <button 
                  onClick={() => onShare(content)}
                  className="text-[11px] font-bold uppercase px-4 py-2 rounded-xl bg-cyan-100 text-cyan-700 border border-cyan-200 hover:bg-cyan-200 transition-all shadow-sm"
                >
                  Share
                </button>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-slate-800 leading-relaxed mb-6">{content}</p>
            
            {/* --- INSTAGRAM CHARACTER LIMIT CHECK --- */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Instagram Limit</span>
                <span className={`text-sm font-mono ${content.length > 2200 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                  {content.length.toLocaleString()} / 2,200
                </span>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${content.length > 2200 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {content.length > 2200 ? 'Too Long' : 'Good to Post'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}