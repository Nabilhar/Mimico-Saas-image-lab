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
  const [postType, setPostType] = useState("PAS");
  
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

    const events: EventAttributes[] = timeSlots.map((time) => {
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

    createEvents(events, (error, value) => {
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

  async function handleGenerate() {
    setLoading(true);
    setContent(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Generate a ${postType} post for ${business_name}`,
          business_name, location,category, niche, voice,  postType, 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const cleanPost = data.content.replace(/<research>[\s\S]*?<\/research>/g, "").trim();
        setContent(cleanPost);
        setTimeout(() => {
          if (saveRef.current) saveRef.current(cleanPost);
        }, 500);
      } else {
        // Show the error from the API (rate limit, missing key, etc.)
        setContent(data.error || "Something went wrong. Please try again.");
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mimico Content AI</h2>
          <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded uppercase tracking-widest">M8V Engine</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Business</label>
            <input className="mt-1 w-full p-3 border rounded-xl bg-slate-50 text-slate-500 outline-none cursor-not-allowed" value={business_name} onChange={(e) => setVoice(e.target.value)} readOnly />
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
  
          {/* BUTTON SECTION */}
          <div className="mt-6">
            <button 
              onClick={handleGenerate}
              disabled={loading || !canGenerate}
              className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 ${
                !canGenerate 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-cyan-800 text-white hover:bg-cyan-900 shadow-cyan-900/10'
              }`}
            >
              {loading ? (
                "Analyzing Mimico Data..."
              ) : !canGenerate ? (
                "No credits remaining - Contact to recharge"
              ) : (
                "Generate Local Post"
              )}
            </button>
          </div>

          {/* STATUS & RESEARCH AGENT SECTION */}
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

          {/* HELPFUL RECHARGE HINT */}
          {!canGenerate && !loading && (
            <p className="mt-3 text-center text-[10px] text-slate-400 italic">
              Need more posts? Reach out to support to recharge your credits.
            </p>
          )}
        </div>
      </div>

      {content && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Mimico Draft Ready</span>
              <span className="text-[10px] font-medium text-slate-400 mt-1 italic">Generated Just Now</span>
            </div>
            <PostActions 
                content={content} 
                onDelete={() => setContent(null)} // Make sure onDelete is passed into this component's props
                showCopy={false} 
              />
          </div>
          <p className="whitespace-pre-wrap text-slate-800 leading-relaxed mb-8 font-medium text-sm">{content}</p>
        </div>
      )}

      {/* STRATEGY & HABIT BUILDER */}
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
              {/* ONLY show date picker for One-Time Reminders */}
              {strategy === "next" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                    Reminder Date
                  </label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                {/* Time slots always show so they can pick THEIR preferred time for the habit */}
                {timeSlots.map((time, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {strategy === "next" ? "Reminder Time" : `Daily Slot ${idx + 1}`}
                    </span>
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
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleSmartScheduleSubmit}
              disabled={strategy === "none"}
              className={`w-full font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                strategy === "none"
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-slate-900 text-white hover:bg-black shadow-slate-900/20"
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