"use client";

import { useState, useEffect, useRef } from "react"; 
import { VOICES } from "@/lib/constants";
import { useUser } from "@clerk/nextjs";
import { createEvents, EventAttributes } from 'ics';
import PostActions from "./PostActions";


interface GenerateDashboardProps {
  onGenerateSuccess?: (content: string) => void;
  onShare: (content: string) => void;
  canGenerate: boolean; 
  onDelete: () => void;
}

// FIX: Added canGenerate here so the component can actually use the value
export function GenerateDashboard({ onGenerateSuccess, onShare, canGenerate, onDelete }: GenerateDashboardProps) {
  const { user } = useUser();
  const saveRef = useRef(onGenerateSuccess);

  // Profile States
  const [business_name, setbusiness_name] = useState("Our Local Business");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Food & Beverage");
  const [niche, setNiche] = useState("");
  const [voice, setVoice] = useState("The Neighbor");
  const [postType, setPostType] = useState("5 Tips");
  const [promoType, setPromoType] = useState("discount");
  const [eventType, setEventType] = useState("event");
  const [customDetails, setCustomDetails] = useState("")
  
  // Generation States
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Initializing...");

  // Scheduler States
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


  const handleStrategyChange = (val: string) => {
    setStrategy(val);
    if (val === "3-day") setTimeSlots(["09:00", "13:00", "18:00"]);
    else if (val === "2-day") setTimeSlots(["09:00", "17:00"]);
    else setTimeSlots(["09:00"]); 
  };

  // --- LOCAL CALENDAR SYNC (ICS) ---
  const handleSmartScheduleSubmit = async () => {

    const dateToUse = (strategy === "daily" || strategy === "2-day" || strategy === "3-day") 
    ? new Date().toISOString().split('T')[0] 
    : selectedDate;

    const callendarEvents: EventAttributes[] = timeSlots.map((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const [year, month, day] = selectedDate.split('-').map(Number);

      let recurrenceRule = '';
    if (strategy === "daily" || strategy === "2-day" || strategy === "3-day") {
      recurrenceRule = 'FREQ=DAILY;INTERVAL=1'; // Repeats every single day
    }

      return {
        start: [year, month, day, hours, minutes],
        duration: { minutes: 10 },
        title: `🎨 Mimico Studio: Time to Create!`,
        description: `Open your Mimico Studio dashboard to generate and share today's local post for ${business_name}.\n\nGo to: ${window.location.origin}/dashboard`,
        location: 'Mimico, Toronto',
        url: window.location.origin,
        status: 'CONFIRMED',
        busyStatus: 'FREE',
        categories: ['Marketing (Mimico Studio)'],
        ...(recurrenceRule && { recurrenceRule })        
      };
    });

    createEvents(callendarEvents, (error, value) => {
      if (error) {
        console.error("❌ Calendar Error:", error);
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mimico-habit-schedule.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      const msg = strategy === "next"
      ? "📅 Reminder set for your selected date!" 
      : "📅 Daily Habit Synced! Your calendar will now remind you every day.";
    alert(msg);
      setStrategy("none");
    });
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  async function handleGenerate(retryCount = 0) {
    
    if (retryCount === 0) {
    setLoading(true);
    setContent(null);
    }
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Generate a ${postType} post for ${business_name}`,
          business_name,
           location,
           category,
           niche,
           voice,  
           postType, 
           promoType,    // "discount", "freebie", or "custom"
           eventType,    // "news", "event", "update"
           customDetails, // The raw text from the box
           business_id: user?.id
        }),
      });
      const data = await res.json();
      if (!res.ok)throw new Error(data.error || "Generation failed");
      
        //1. Clean the post content
        const cleanPost = data.content
        .replace(/<research>[\s\S]*?<\/research>/gi, "") // Remove research tags
        .replace(/--- RAW RESPONSE ---[\s\S]*?--- END STRIPPED ---/gi, "") // Remove debug headers if they exist
        .replace(/\*Check.*?\*/gi, "") // Remove bulleted checks
        .replace(/Total words: \d+/gi, "") // Remove word count comments
        .trim();
        
        setContent(cleanPost);

        if (saveRef.current) {
          await saveRef.current(cleanPost);
        }
  
        setLoading(false); 
  
      } catch (err: any) {
        console.error("Generation Error:", err);
        setContent(err.message || "The M8V engine is temporarily unavailable.");
        setLoading(false);
      }

/*        // 2. RUN THE QUALITY CHECK (The "Bouncer")
        const wordCount = cleanPost.split(/\s+/).filter(Boolean).length;
        const lastChar = cleanPost.trim().slice(-1);
        const endsWithPunctuation = ['.', '!', '?', '"', '”','#' ].includes(lastChar);
        const endsWithHashtag = /#\w+$/.test(cleanPost);

        const isComplete = endsWithPunctuation || endsWithHashtag;

       // 3. SILENT RETRY LOGIC
      // If too short OR unfinished, and we haven't tried 3 times yet...
         if ((wordCount < 30 || !isComplete) && retryCount < 2) {
          console.warn(`Retry #${retryCount + 1}: Post was ${wordCount} words/incomplete. Retrying...`);
          await delay(6000);
          return await handleGenerate(retryCount + 1); // <--- Recursion happens here
        }

        // 4. SUCCESS: Set content and trigger save
        setContent(cleanPost);

        // Save it immediately
        if (saveRef.current) {
          await saveRef.current(cleanPost);
        }

        setLoading(false); // Stop loading ONLY on success

      } catch (err: any) {
        console.error(`Error on try #${retryCount + 1}:`, err);
        
        // If it's a "Failed to fetch" or similar network error, 
        // retrying usually won't help immediately, so we stop.
        // But if you want to retry even on network errors, use this logic:
        if (retryCount < 2) {
          console.warn("Network/Server error. Retrying...");
          await delay(2000);
          return await handleGenerate(retryCount + 1);
        }
  
        // If we've hit the max retries (2, which is the 3rd attempt) 
        // or we decide not to retry this specific error:
        setContent(err.message || "The M8V engine is temporarily unavailable. Please try again.");
        setLoading(false);
      }
  
*/ 
    }  
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mimico Content AI</h2>
          <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded uppercase tracking-widest">M8V Engine</span>
        </div>
        
        <div className="space-y-4">
          {/* BUSINESS NAME (READ ONLY) */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Business</label>
            <input className="mt-1 w-full p-3 border rounded-xl bg-slate-50 text-slate-500 outline-none cursor-not-allowed" value={business_name} readOnly />
          </div>
  
          {/* VOICE & STYLE GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Brand Voice</label>
              <select className="mt-1 w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition-all" value={voice} onChange={(e) => setVoice(e.target.value)}>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
           
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Post Style</label>
              <select 
                value={postType} 
                onChange={(e) => {
                  setPostType(e.target.value);
                  setCustomDetails(""); 
                }} 
                className="mt-1 w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
              >
                <option value="5 Tips">5 Tips</option>
                <option value="Myth-busting">Myth-busting</option>
                <option value="Behind the scenes">Behind the scenes</option>
                <option value="Promotion / offer">Promotion / offer</option>
                <option value="Local event / news">Local event / news</option>
              </select>
            </div>
          </div>

          {/* --- CONDITIONAL PROMOTION BOXES --- */}
          {postType === "Promotion / offer" && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Promotion Type</label>
                <select 
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-white border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-cyan-100 transition-all"
                >
                  <option value="discount">Discount %</option>
                  <option value="freebie">Freebie / Gift</option>
                  <option value="custom">Custom Offer</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Offer Details</label>
                <textarea 
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g., 20% off all curries until Friday..."
                  className="w-full p-3 border rounded-xl border-slate-200 min-h-[100px] outline-none focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>
          )}

          {/* --- CONDITIONAL EVENT BOXES --- */}
          {postType === "Local event / news" && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Update Category</label>
                <select 
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-white border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-cyan-100 transition-all"
                >
                  <option value="event">Community Event</option>
                  <option value="news">Local News</option>
                  <option value="update">General Update</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Event/News Details</label>
                <textarea 
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g., The Mimico Waterfront Festival is happening this Saturday!"
                  className="w-full p-3 border rounded-xl border-slate-200 min-h-[100px] outline-none focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>
          )}
  
          {/* BUTTON SECTION */}
          <div className="mt-6">
            <button 
              onClick={() => { handleGenerate(); }}
              disabled={loading || !canGenerate}
              className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 ${
                !canGenerate 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-cyan-800 text-white hover:bg-cyan-900 shadow-cyan-900/10'
              }`}
            >
              {loading ? "Analyzing Mimico Data..." : !canGenerate ? "No credits remaining" : "Generate Local Post"}
            </button>
          </div>

          {/* STATUS AGENT */}
          {loading && (
            <div className="mt-4 p-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-cyan-400 rounded-full animate-ping" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Local Research Agent</span>
                  <span className="text-sm text-cyan-100 font-medium">{status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RESULT SECTION */}
      {content && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Mimico Draft Ready</span>
              <span className="text-[10px] font-medium text-slate-400 mt-1 italic">Generated Just Now</span>
            </div>
            <PostActions content={content} onDelete={() => setContent(null)} />
          </div>
          <p className="whitespace-pre-wrap text-slate-800 leading-relaxed mb-8 font-medium text-sm">
            {content}
          </p>
          <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-cyan-700">M8V Engine: Share Ready</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Words</span>
              <span className="text-[11px] font-bold text-slate-900">{content.trim().split(/\s+/).length}</span>
            </div>
          </div>
        </div>
      )}

      {/* STRATEGY SECTION */}
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm italic">Post Strategy & Habit Builder</h3>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Local Calendar Reminders</p>
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
            <div className="space-y-3">
              {strategy === "next" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Reminder Date</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {timeSlots.map((time, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {strategy === "next" ? "Reminder Time" : `Daily Slot ${idx + 1}`}
                    </span>
                    <input type="time" value={time} onChange={(e) => {
                      const newTimes = [...timeSlots];
                      newTimes[idx] = e.target.value;
                      setTimeSlots(newTimes);
                    }} className="text-sm font-bold text-slate-700 outline-none bg-transparent" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleSmartScheduleSubmit}
              disabled={strategy === "none"}
              className={`w-full font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                strategy === "none" ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-slate-900 text-white hover:bg-black shadow-slate-900/20"
              }`}
            >
              Sync Habit to Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}