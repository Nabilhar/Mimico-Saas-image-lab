"use client";

import { useState, useEffect, useRef } from "react"; 
import { VOICES } from "@/lib/constants";
import { useUser } from "@clerk/nextjs";
import { createEvents, EventAttributes } from 'ics';
import PostActions from "./PostActions";
import { Post } from "@/app/dashboard/page";
import { SavedImage } from "@/components/SavedImage";


interface GenerateDashboardProps {
  onGenerateSuccess?: (content: string, imageUrl: string) => Promise<string | undefined>;
  onShare?: (content: string, imageUrl?: string) => void;
  canGenerate: boolean; 
  userCredits: number;
  onDelete: () => void;
  supabase: any;
  history?: Post[];
  onImageUpdated?: () => Promise<void>;
}

// FIX: Added canGenerate here so the component can actually use the value
export function GenerateDashboard({ onGenerateSuccess, onShare, canGenerate, userCredits, onDelete, supabase, history, onImageUpdated }: GenerateDashboardProps) {
  const { user } = useUser();


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
  const [lastPostId, setLastPostId] = useState<string | null>(null);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

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
      const [year, month, day] = dateToUse.split('-').map(Number);

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
    setLastPostId(null);
    setCurrentImage(null);
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
           business_id: user?.id,
           history: history
        }),
      });

      if (!res.ok) {
        const errorText = await res.text(); // Get the "Internal Server Error" text
        console.error("Post Generator Server crashed:", errorText);
        throw new Error(`Server Error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
        //1. Clean the post content
        const cleanPost = data.content
        .replace(/<research>[\s\S]*?<\/research>/gi, "") // Remove research tags
        .replace(/--- RAW RESPONSE ---[\s\S]*?--- END STRIPPED ---/gi, "") // Remove debug headers if they exist
        .replace(/\*Check.*?\*/gi, "") // Remove bulleted checks
        .replace(/Total words: \d+/gi, "") // Remove word count comments
        .trim();
        
        setContent(cleanPost);

        // --- THE FIX: Capture the ID ---
        if (onGenerateSuccess) {
          // Assuming your parent function returns the ID from the Supabase insert
          const generatedUuid = await onGenerateSuccess(cleanPost, "");
          if (generatedUuid) {
            setLastPostId(generatedUuid); // Now we have the auto-generated Supabase ID!
            console.log("✅ Post recorded in Supabase. ID:", generatedUuid);
            } else {
              console.error("❌ Failed to get UUID. Image generation will fail.");

          }
        }
  
        setLoading(false); 
  
      } catch (err: any) {
        console.error("Generation Error:", err);
        setContent(err.message || "The M8V engine is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
  }
  
    const handleGenerateImage = async () => {
      // Guard: Don't run if we don't have the UUID from the DB yet
      if (!lastPostId || !content) {
        alert("Save the post first to generate an image.");
        return;
      }
        setIsGeneratingImage(true);
        try {
          const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              generatedPost: content, 
              business_name, // Pull from your context/state
              location,   // "Mimico, Toronto"
              postId: lastPostId
            }),
          });

          if (!response.ok) {
            const errorText = await response.text(); 
            console.error("Image Generator Server crashed:", errorText);
            throw new Error(`Image Server Error (${response.status}): ${errorText}`);
          }

          const data = await response.json();

          if (data.url) {

            console.log("Attempting Image Credit Deduction & URL Update...");

            // CALL THE BOUNCER: This deducts 2 credits AND saves the URL
            const { error: rpcError } = await supabase.rpc('save_image_and_deduct', {
              target_post_id: lastPostId,
              new_image_url: data.url,
              clerk_user_id: user?.id
            });
  
            if (rpcError) {
              console.error("❌ Bouncer rejected image save:", rpcError);
              throw new Error(rpcError.message);
            }
  
            // Success State
            console.log("✅ 2 Credits Deducted and Database Updated");
            setCurrentImage(data.url);
            
            // This triggers the parent to refresh the credit count display
            if (onImageUpdated) await onImageUpdated();

          }
        } catch (err) {
          console.error("Lab Error:", err);
          alert("Image generation failed. Check terminal.");
        } finally {
          setIsGeneratingImage(false);
        }
      };
  
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
              // UPDATE: Disable if loading OR if credits are less than 1
              disabled={loading || userCredits < 1} 
              className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 ${
                userCredits < 1 // UPDATE: Check credits here for styling
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-cyan-800 text-white hover:bg-cyan-900 shadow-cyan-900/10'
              }`}
            >
              {loading 
                ? "Analyzing Mimico Data..." 
                : userCredits < 1 
                  ? "Fill up credits" // UPDATE: Custom message
                  : "Generate Local Post (1 Credit)"}
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

{/* RESULT SECTION - Facebook Style Preview */}
      {content && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-3 ml-1 tracking-widest">
            New Post Preview
          </h2>
          
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            
            {/* 1. Mock Header (Standard Social Layout) */}
            <div className="p-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {business_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">{business_name}</p>
                  <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">Just now • Mimico, ON 🌐</p>
                </div>
              </div>
              <PostActions content={content} onDelete={onDelete} />
            </div>

            {/* 2. Caption Area (Before the Image) */}
            <div className="px-5 py-4">
              <p className="text-slate-800 whitespace-pre-wrap text-[15px] leading-relaxed font-normal">
                {content}
              </p>
            </div>

            {/* 3. Creative Canvas (The Improved "Ugly Box") */}
            <div className="aspect-square w-full relative group overflow-hidden bg-slate-50 border-y border-slate-100">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt="Generated visual"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all">
                  
                  {isGeneratingImage ? (
                    /* --- MODERN SPINNER STATE --- */
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-20 h-20 mb-6">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 rounded-full border-4 border-cyan-100 opacity-25"></div>
                        {/* Spinning Ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-t-cyan-600 animate-spin"></div>
                        {/* Pulsing Center */}
                        <div className="absolute inset-2 rounded-full bg-cyan-50 animate-pulse flex items-center justify-center">
                          <span className="text-2xl">🎨</span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-800 animate-pulse">
                        Painting your Mimico scene...
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-2 max-w-[240px] font-medium leading-tight">
                        Applying local textures and lighting to match your brand voice.
                      </p>
                    </div>
                  ) : (

                    /* --- IDLE STATE (Inside the Creative Canvas) --- */
                  <button 
                    onClick={handleGenerateImage}
                    // UPDATE: Disable if no Post ID OR if credits are less than 2
                    disabled={!lastPostId || userCredits < 2} 
                    className={`flex flex-col items-center text-center group/btn active:scale-95 transition-all ${
                      userCredits < 2 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm border flex items-center justify-center mb-4 transition-all ${
                      userCredits < 2 
                        ? 'border-slate-100' 
                        : 'border-slate-200 group-hover/btn:border-cyan-300 group-hover/btn:shadow-md'
                    }`}>
                      <svg className={`w-8 h-8 ${userCredits < 2 ? 'text-slate-200' : 'text-slate-400 group-hover/btn:text-cyan-600'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <span className={`text-sm font-bold ${userCredits < 2 ? 'text-slate-400' : 'text-slate-900 group-hover/btn:text-cyan-700'}`}>
                      {userCredits < 2 ? "Fill up credits" : "Generate Matching Image"}
                    </span>
                    
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                      {userCredits < 2 ? "Requires 2 Credits" : "Costs 2 Credits"}
                    </p>
                  </button>
                  )}
                </div>
              )}
            </div>

{/* 4. Footer Stats */}
<div className="px-5 py-3 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">M8V Engine: Optimized</span>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase">
                {content.trim().split(/\s+/).filter(Boolean).length} Words
              </div>
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
    </div> // This closes the main mx-auto container
  ); // This closes the return statement
} // This closes the function