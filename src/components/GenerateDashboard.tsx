"use client";

import { getFramework, FRAMEWORK_DEFINITIONS } from "@/lib/frameworks";
import { useState, useEffect, useRef } from "react"; 
import { VOICES } from "@/lib/constants";
import { useUser, useSession } from "@clerk/nextjs";
import { createSmartSchedule } from "@/lib/googleCalendar";

interface GenerateDashboardProps {
  onGenerateSuccess?: (content: string) => void;
  onShare: (content: string) => void;
}

export function GenerateDashboard({ onGenerateSuccess, onShare }: GenerateDashboardProps) {
  const { user } = useUser();
  const { session } = useSession();
  const saveRef = useRef(onGenerateSuccess);

  // Profile States
  const [business_name, setbusiness_name] = useState("Our Local Business");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Food & Beverage");
  const [niche, setNiche] = useState("");
  const [voice, setVoice] = useState("The Neighbor");
  const [postType, setPostType] = useState("PAS");
  
  // Generation States
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [copied, setCopied] = useState(false);

  // Scheduler States (Permanent)
  const [strategy, setStrategy] = useState("none");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<string[]>(["09:00"]);

  const loadingPhases = [
    "Locating address...",
    "Identifying local landmarks...",
    "Researching neighborhood trends...",
    "Applying strategy...",
    "Polishing owner voice...",
    "Finalizing post..."
  ];

  useEffect(() => {
    saveRef.current = onGenerateSuccess;
  }, [onGenerateSuccess]);

  // Load Profile
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

  // Loading Interval
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

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  const handleStrategyChange = (val: string) => {
    setStrategy(val);
    if (val === "3-day") setTimeSlots(["09:00", "13:00", "18:00"]);
    else if (val === "2-day") setTimeSlots(["09:00", "17:00"]);
    else setTimeSlots(["09:00"]); 
  };
    
  const handleSmartScheduleSubmit = async () => {
    try {
      const googleToken = await (session as any)?.getToken({ provider: "oauth_google" });
      if (!googleToken) {
        alert("To use the Calendar, you need to connect your Google Account.");

        // This helper forces Clerk to open the Google OAuth flow 
      // and "link" it to the current email account.
      const res = await user?.createExternalAccount({
        strategy: 'oauth_google',
        redirectUrl: window.location.href, // Come back here after linking
        additionalScopes: ['https://www.googleapis.com/auth/calendar.events'],
      });

      // Redirect the user to the Google Consent screen
      if (res?.verification?.externalVerificationRedirectURL) {
        window.location.href = res.verification.externalVerificationRedirectURL.toString();
      
        return;

      }}
      const slotsToSquare = timeSlots.map(t => ({
        date: strategy === 'next' ? selectedDate : undefined,
        time: t
      }));
      const success = await createSmartSchedule(googleToken, business_name, slotsToSquare, strategy);
      if (success) {
        alert(`Success! Your Mimico reminder schedule is synced.`);
      }
    } catch (error) {
      console.error("Calendar Error:", error);
      alert("Connection failed. Make sure you allow Google Calendar permissions.");
    }
  };

  async function handleGenerate() {
    setLoading(true);
    setContent(null);
    const selectedFramework = getFramework(category, postType, voice);
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
        setTimeout(() => {
          if (saveRef.current) saveRef.current(cleanPost);
        }, 500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      {/* --- BENTO 1: CONFIGURATION (PERMANENT) --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mimico Content AI</h2>
          <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded uppercase tracking-widest">M8V Engine</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Business</label>
            <input className="mt-1 w-full p-3 border rounded-xl bg-slate-50 text-slate-500 outline-none cursor-not-allowed" value={business_name} readOnly />
          </div>
  
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Brand Voice</label>
              <select className="mt-1 w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition-all" value={voice} onChange={(e) => setVoice(e.target.value)}>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Post Style</label>
              <select value={postType} onChange={(e) => setPostType(e.target.value)} className="mt-1 w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition-all">
                <option value="PAS">PAS (Problem)</option>
                <option value="BAB">BAB (Bridge)</option>
                <option value="AIDA">AIDA (Action)</option>
              </select>
            </div>
          </div>
  
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-cyan-800 text-white font-bold py-4 rounded-2xl hover:bg-cyan-900 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-cyan-900/10"
          >
            {loading ? "Analyzing Mimico Data..." : "Generate Local Post"}
          </button>
        </div>
  
        {/* --- THE LOADING BAR (Appears inside the stack while working) --- */}
        {loading && (
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-cyan-400 rounded-full animate-ping" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500">Local Research Agent</span>
                <span className="text-sm text-cyan-100 font-medium">{status}</span>
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full transition-all duration-1000 ease-linear" style={{ width: `${((loadingPhases.indexOf(status) + 1) / loadingPhases.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
  
      {/* --- BENTO 2: THE GENERATED POST (DYNAMIC MIDDLE) --- */}
      {content && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Mimico Draft Ready</span>
              <span className="text-[10px] text-slate-400 italic font-medium">Optimized for M8V Community</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="text-[11px] font-bold uppercase px-4 py-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-sm transition-all">
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={() => onShare(content)} className="text-[11px] font-bold uppercase px-4 py-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-sm transition-all">
                Share
              </button>
            </div>
          </div>
  
          <p className="whitespace-pre-wrap text-slate-800 leading-relaxed mb-8 font-medium text-sm">{content}</p>
          
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">Instagram Limit</span>
              <span className={`text-sm font-mono ${content.length > 2200 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{content.length.toLocaleString()} / 2,200</span>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${content.length > 2200 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{content.length > 2200 ? 'Too Long' : 'Good to Post'}</span>
          </div>
        </div>
      )}
  
      {/* --- BENTO 3: THE SCHEDULER (PERMANENT BOTTOM) --- */}
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm italic">Post Strategy & Habit Builder</h3>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Remind me to share in Mimico</p>
          </div>
          <span className="text-xl">📅</span>
        </div>
  
        <div className="space-y-4">
          <select 
            value={strategy}
            onChange={(e) => handleStrategyChange(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:border-cyan-500 focus:bg-white outline-none transition-all cursor-pointer"
          >
            <option value="none">No Automated Reminders</option>
            <option value="next">One-Time Reminder</option>
            <option value="daily">Daily Habit (1/day)</option>
            <option value="2-day">Growth Mode (2/day)</option>
            <option value="3-day">Aggressive Mode (3/day)</option>
          </select>
  
          {strategy !== "none" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              {strategy === 'next' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Target Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-2">
                {timeSlots.map((time, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Slot {idx + 1}</span>
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...timeSlots];
                        newTimes[idx] = e.target.value;
                        setTimeSlots(newTimes);
                      }}
                      className="text-sm font-bold text-slate-700 outline-none bg-transparent"
                    />
                  </div>
                ))}
              </div>
  
              <button 
                onClick={handleSmartScheduleSubmit}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl"
              >
                Sync Habit to Google Calendar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}