// GenerateDashboard

"use client";

import { useState, useEffect, useRef } from "react"; 
import { VOICES } from "@/lib/constants";
import { getFramework } from "@/lib/frameworks";
import { useUser } from "@clerk/nextjs";
import { createEvents, EventAttributes } from 'ics';
import PostActions from "@/components/PostActions";
import { Post } from "@/app/dashboard/page";
import { SavedImage } from "@/components/SavedImage";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface GenerateDashboardProps {
  businessData: any;
  onGenerateSuccess?: (content: string, imageUrl: string) => Promise<string | undefined>;
  onShare?: (content: string, imageUrl?: string) => void;
  canGenerate: boolean; 
  userCredits: number;
  onDelete: () => void;
  supabase: any;
  history?: Post[];
  onImageUpdated?: () => Promise<void>;
  voice: string; 
  onVoiceChange: (newVoice: string) => void;
}

// FIX: Added canGenerate here so the component can actually use the value
export function GenerateDashboard({ onGenerateSuccess, onShare, canGenerate, userCredits, onDelete, supabase, history, voice, onImageUpdated, businessData, onVoiceChange }: GenerateDashboardProps) {
  const { user } = useUser();
  const router = useRouter();

  // Profile States
  const [business_name, setbusiness_name] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province_state, setProvinceState] = useState("");
  const [country, setCountry] = useState("Canada");
  const [postalCode, setPostalCode] = useState("");
  const [category, setCategory] = useState("");
  const [niche, setNiche] = useState("");
  const [postType, setPostType] = useState("Behind the scenes");
  const [promoType, setPromoType] = useState("discount");
  const [eventType, setEventType] = useState("event");
  const [customDetails, setCustomDetails] = useState("")
  const [currentWeather, setCurrentWeather] = useState("");

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

  // --- LOCAL CALENDAR SYNC (ICS) ---
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const loadingPhases = [
    "Locating address...",
    "Identifying local landmarks...",
    "Researching neighbourhood trends...",
    "Applying strategy...",
    "Polishing owner voice...",
    "Finalizing post..."
  ];

  // Master Initialization: Load Profile and Last Post from Supabase
  useEffect(() => {
    // 1. SYNC PROFILE FROM PROPS (Lifting State Up)
    // We no longer fetch the profile from Supabase here because DashboardPage already did it.
    if (businessData) {
      console.log("Child received businessData:", businessData); // Debug log
      setbusiness_name(businessData.business_name || "");
      setStreet(businessData.street || "");
      setCity(businessData.city || "");
      setProvinceState(businessData.province_state || "");
      setCountry(businessData.country || "Canada");
      setPostalCode(businessData.postal_code || "");
      setCategory(businessData.category || "Food & Beverage");
      setNiche(businessData.niche || "");
    }

    // 2. Pull the Last Generated Post (Still needed as this is post-specific, not profile-specific)
    const fetchLastPost = async () => {
      if (!user?.id) return;

      console.log("Fetching last post for UI preview...");
      const { data: lastPost } = await supabase
        .from('community_posts')
        .select('id, content, image_url')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPost) {
        setContent(lastPost.content);
        setLastPostId(lastPost.id);
        setCurrentImage(lastPost.image_url || null);
      }
    };

    fetchLastPost();
  }, [user?.id, supabase, businessData]);

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

  // THE SCROLL LOCK EFFECT HERE:
  useEffect(() => {
    if (showCalendarModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to ensure scroll is restored if component unmounts
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCalendarModal]);

  const handleStrategyChange = (val: string) => {
    setStrategy(val);
    if (val === "3-day") setTimeSlots(["09:00", "13:00", "18:00"]);
    else if (val === "2-day") setTimeSlots(["09:00", "17:00"]);
    else setTimeSlots(["09:00"]); 
  };


    const handleSmartScheduleSubmit = async () => {

      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const dateToUse = (strategy === "daily" || strategy === "2-day" || strategy === "3-day")
        ? localDate
        : selectedDate;
    
      const calendarEvents: EventAttributes[] = timeSlots.map((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const [year, month, day] = dateToUse.split('-').map(Number);
    
        let recurrenceRule = '';
        if (strategy === "daily" || strategy === "2-day" || strategy === "3-day") {
          recurrenceRule = 'FREQ=DAILY;INTERVAL=1';
        }
    
        return {
          start: [year, month, day, hours, minutes],
          duration: { minutes: 10 },
          title: `🎨 Shoreline Studio: Time to Create!`,
          description: `Open your Shoreline Studio dashboard to generate and share today's local post for ${business_name}.\n\nGo to: ${window.location.origin}/dashboard`,
          location: `${street}, ${city}, ${province_state}, ${country}`,
          url: window.location.origin,
          status: 'CONFIRMED',
          busyStatus: 'FREE',
          categories: ['Marketing (Shoreline Studio)'],
          ...(recurrenceRule && { recurrenceRule })
        };
      });
    
      createEvents(calendarEvents, (error, value) => {
        if (error) {
          console.error("❌ Calendar Error:", error);
          return;
        }
    
        // Trigger the download
        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Shoreline-post-alert.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    
        // Show guidance modal instead of alert
        setShowCalendarModal(true);
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
          prompt: `Generate a ${postType} post for ${business_name}in ${city}, ${province_state} ${country}`,
          business_name,
          street,
          city,
          province_state,
          country,
          postal_code: postalCode,
          category,
          niche,
          voice,  
          postType, 
          promoType,    // "discount", "freebie", or "custom"
          eventType,    // "news", "event", "update"
          customDetails, // The raw text from the box
          business_id: user?.id,
          history: history,
          currentWeather,
          currentMonth: new Date().toLocaleString("en", { month: "long" })
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

        const weather = data.currentWeather || "";
        setCurrentWeather(weather);

        // --- THE FIX: Capture the ID ---
        if (onGenerateSuccess) {
          // Assuming your parent function returns the ID from the Supabase insert
          const generatedUuid = await onGenerateSuccess(cleanPost, "");
          if (generatedUuid) {
            setLastPostId(generatedUuid); // Now we have the auto-generated Supabase ID!

            console.log("✅ Post recorded in Supabase. ID:", generatedUuid);

            // while the user is reading the text.
          fetch("/api/prepare-image-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              postId: generatedUuid,
              generatedPost: cleanPost,
              currentWeather: weather, 
              business_name,
              business_id: user?.id,
              street,
              city,
              province_state,
              country,
              postal_code: postalCode,
              niche,
              voice,          // Added
              postType,
              currentMonth: new Date().toLocaleString("en", { month: "long" }),
            }),
          }).catch(err => console.error("Background Architect failed:", err));
        } else {
          console.error("❌ Failed to get UUID. Image generation will fail.");
        }
      }
    } catch (err: any) {
      setContent(err.message || "Engine unavailable.");
    } finally {
        setLoading(false); 
    }
  } 

  const handleGenerateClick = () => {
    if (userCredits < 2) {
      // Redirect to the Home page, specifically to the #cta section
      router.push("/#cta");
    } else {
      handleGenerate();
    }
  };
  
  const handleGenerateImage = async () => {
    // 1. Initial Guards
    if (!lastPostId || !content) {
      toast.error("Save the post first to generate an image.");
      return;
    }
  
    if (userCredits < 3) {
      toast.error("Not enough credits! You need 3 credits for image generation.");
      return;
    }
  
    setIsGeneratingImage(true);
  
    const pollInterval = 3000; // 3 seconds
    let attempts = 0;
    const maxAttempts = 20; // 60 seconds total wait
  
    const pollForImage = async () => {
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            postId: lastPostId, 
            business_id: user?.id,
            business_name, 
            street,
            province_state,
            city,
            country,
            postal_code: postalCode
          }),
        });
  
        const data = await res.json();
  
        // CASE 1: Still Processing (Architect is searching/writing)
        if (res.status === 202) {
          if (attempts < maxAttempts) {
            attempts++;
            console.log(`Polling Architect... Attempt ${attempts}/${maxAttempts}`);
            setTimeout(pollForImage, pollInterval);
          } else {
            toast.error("Architect is taking too long. Please try again.");
            setIsGeneratingImage(false);
          }
        } 
        
        // CASE 2: Image Ready
        else if (data.url) {
          console.log("✅ Image received! Deducting credits and saving to DB...");
  
          // --- MERGED LOGIC: THE BOUNCER ---
          // This deducts 2 credits AND saves the URL in one transaction
          const { error: rpcError } = await supabase.rpc('save_image_and_deduct', {
            target_post_id: lastPostId,
            new_image_url: data.url,
            clerk_user_id: user?.id
          });
  
          if (rpcError) {
            console.error("❌ Bouncer rejected image save:", rpcError);
            toast.error(`Database Error: ${rpcError.message}`);
            setIsGeneratingImage(false);
            return;
          }
  
          // Final UI Success Updates
          setCurrentImage(data.url);
          toast.success("Image generated and saved! 🎨");
          setIsGeneratingImage(false);
          
          // Refresh the credit display in the header
          if (onImageUpdated) await onImageUpdated();
        } 
        
        // CASE 3: Architect Error (Gemma/Gemini failed)
        // we don't just stop. We call the Architect to FIX it.
        else if (data.status === 'ERROR' || res.status >= 400) {
          console.log("🚨 Error detected in prompt. Triggering Architect repair...");
          
          // Show a loading toast so the user knows we are "fixing" it rather than "failing"
          toast.loading("Prompt error detected. Repairing...", { id: 'repair' });

          try {
            // MANUALLY TRIGGER THE ARCHITECT TO OVERWRITE THE ERROR
            await fetch("/api/prepare-image-prompt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                postId: lastPostId,
                generatedPost: content,
                business_name,
                business_id: user?.id,
                street,
                city,
                province_state,
                country,
                postal_code: postalCode,
                voice,
                framework: getFramework(category, postType, voice),
                postType,
                currentMonth: new Date().toLocaleString("en", { month: "long" }),
              }),
            });

            toast.success("Prompt repaired! Resuming generation...", { id: 'repair' });

            // IMPORTANT: Now that the database is fixed, we restart the polling loop!
            // This will make the next attempt hit CASE 2 (Success)
            pollForImage();

          } catch (repairErr) {
            console.error("Repair attempt failed:", repairErr);
            toast.error("Failed to repair prompt. Please try manual generation.", { id: 'repair' });
            setIsGeneratingImage(false);
          }
        }
  
      } catch (err) {
        console.error("Polling failed:", err);
        setIsGeneratingImage(false);
        toast.error("Network error while generating image.");
      }
    };
  
    pollForImage();
  };

  const isDetailsRequired = postType === "Promotion / offer" || postType === "Local event / news";
  const isDetailsMissing = isDetailsRequired && customDetails.trim().length === 0;
  
  return (

/* 1. OUTER CONTAINER: Full width on mobile, max 5xl on desktop */
<div className="w-full max-w-5xl mx-auto space-y-6">
    
  {/* 2. INPUT AREA: Centered and narrow (2xl) so it doesn't look stretched on wide screens */}
  <div className="max-w-2xl mx-auto w-full">
       <div className="bg-white p-6 sm:rounded-3xl sm:border border-slate-100 sm:shadow-sm">
          {/* ... all your input fields and buttons ... */}
        <div className="hidden sm:flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shoreline Content AI</h2>
          <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded uppercase tracking-widest">AI Engine</span>
        </div>
        
        <div className="space-y-4">
          {/* BUSINESS NAME (READ ONLY) */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Business</label>
            <input 
              className="mt-1 w-full p-3 border rounded-xl bg-slate-50 text-slate-500 outline-none cursor-not-allowed" 
              value={businessData?.business_name || ""} // <--- Reads directly from props
              readOnly 
            />
          </div>
  
          {/* VOICE & STYLE GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Brand Voice</label>
              <select className="mt-1 w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition-all" value={voice} onChange={(e) => onVoiceChange(e.target.value)}>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
           
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Post Style</label>
              <select 
                value={postType} 
                onChange={(e) => {
                  const newType = e.target.value;
                  // Only clear if the box is actually empty, 
                  // or just don't clear it at all so the user doesn't lose data!
                  setPostType(newType);               
                }} 
                className="mt-1 w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
              >
                <option value="Behind the scenes">Behind the scenes</option>
                <option value="Myth-busting">Myth-busting</option>
                <option value="5 Tips">5 Tips</option>
                <option value="Promotion / offer">Promotion / offer</option>
                <option value="Local event / news">Local event / news</option>
                <option value="Community moment">Community moment</option>
                
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
                  {customDetails.trim().length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold ml-1">
                      Required to generate this post type
                    </p>
                  )}
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
                  {customDetails.trim().length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold ml-1">
                      Required to generate this post type
                    </p>
)}
              </div>
            </div>
          )}

            {/* STRATEGY SECTION WRAPPER */}
            <div className="flex flex-col gap-3">
                      {/* STRATEGY SECTION */}
              <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm italic">Time-to-Post-Alerts</h3>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Local Calendar Reminders</p>
                  </div>
                  <span className="text-xl">📅</span>
                </div>

                <div className="space-y-3">
                  <select 
                    value={strategy}
                    onChange={(e) => handleStrategyChange(e.target.value)}
                    className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-bold text-slate-700 focus:border-cyan-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="none">No Automated Reminders</option>
                    <option value="next">One-Time Reminder</option>
                    <option value="daily">Daily Habit (1/day)</option>
                    <option value="2-day">Growth Mode (2/day)</option>
                    <option value="3-day">Aggressive Mode (3/day)</option>
                  </select>

                  {strategy !== "none" && (
                    <div className="space-y-2">
                      {strategy === "next" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Reminder Date</label>
                          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-1">
                        {timeSlots.map((time, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {strategy === "next" ? "Reminder Time" : `Daily Slot ${idx + 1}`}
                            </span>
                            <input type="time" value={time} onChange={(e) => {
                              const newTimes = [...timeSlots];
                              newTimes[idx] = e.target.value;
                              setTimeSlots(newTimes);
                            }} className="text-xs font-bold text-slate-700 outline-none bg-transparent" />
                            </div>
                        ))}
                      </div>
                    </div>
                  )}



                  <button 
                    onClick={handleSmartScheduleSubmit}
                    disabled={strategy === "none"}
                    className={`w-full font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                      strategy === "none" ? "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none" : "bg-slate-900 text-white hover:bg-black shadow-slate-900/20"
                    }`}
                  >
                    Sync Habit to Calendar
                  </button>
                </div>
              </div> {/* <--- THIS CLOSES BOX 1 */}
            </div>
        </div>
      </div>

      {/* BUTTON SECTION */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-0">
      <button 
          onClick={handleGenerateClick}
          disabled={loading || isDetailsMissing}
          className={`w-full mt-8 font-bold py-4 rounded-2xl text-md transition-all shadow-xl active:scale-[0.98] ${
            loading 
              ? 'bg-slate-400 text-white cursor-wait shadow-none' 
              : isDetailsMissing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : userCredits < 2
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/40'
                  : 'bg-cyan-800 text-white hover:bg-cyan-900 shadow-cyan-900/30'
          }`}
        >
          {loading 
            ? "Analyzing Shoreline Data..." 
            : isDetailsMissing
              ? postType === "Promotion / offer" ? "Add offer details to generate" : "Add event details to generate"
              : userCredits < 2 
                ? "Join Waitlist for more Credits"
                : "Generate Local Post (2 Credits)"}
        </button>


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
    <div className="w-full max-w-3xl mx-auto space-y-4 mt-10">
      <h2 className="text-[10px] font-black uppercase text-slate-400 ml-4 sm:ml-1 tracking-widest">
        New Post Preview
      </h2>
      
      <div className="bg-white border-y border-x-0 sm:border-x sm:rounded-3xl shadow-none sm:shadow-sm overflow-hidden">
        
      {/* 1. Mock Header - Stacked on Mobile, Side-by-Side on PC */}
      <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Left/Top Side: Avatar & Business Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
            {(business_name || 'B').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">
            {businessData?.business_name || business_name}</p>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
              Just now • {businessData?.city || city} 🌐
            </p>
          </div>
        </div>

        {/* Right/Bottom Side: Actions */}
        {/* On mobile, this will naturally drop 'underneath' because of flex-col */}
        <div className="flex items-center sm:justify-end">
          <PostActions
            content={content}
            imageUrl={currentImage || undefined}
            onDelete={onDelete}
            showCopy={true}
          />
        </div>
      </div>
          
        {/* 2. Caption Area (Before the Image) */}
        <div className="p-5 text-slate-700 leading-relaxed">
          <p className="text-slate-800 whitespace-pre-wrap text-[15px] leading-relaxed font-normal">
            {content}
          </p>
        </div>

        {/* 3. Creative Canvas (The Improved "Ugly Box") */}
        <div className="w-full aspect-square bg-slate-100 border-t border-slate-50 relative">
          {currentImage ? (
            <img 
              src={currentImage} 
              alt="Generated visual"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all">
              
              {isGeneratingImage ? (
                /* --- MODERN SPINNER STATE --- */
                <div className="flex flex-col items-center text-center px-4">
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
                  
                  {/* DYNAMIC MESSAGE BOX */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800 animate-pulse">
                      Architecting your visual...
                    </h3>
                    <p className="text-[12px] text-slate-500 max-w-[280px] leading-relaxed font-medium">
                      {/* This is the smart message that justifies the wait */}
                      The AI Engine is researching your neighbourhood and mapping your brand colors to the local scenery. 
                      <span className="block mt-2 text-cyan-700 font-semibold">
                        This deep-dive might take a minute, but ensures a perfect, hyper-local match.
                      </span>
                    </p>
                  </div>
                  
                  {/* PROGRESS HINT */}
                  <div className="mt-6 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce"></div>
                    </div>
                    <span>Precision Engineering in Progress</span>
                  </div>
                </div>
              ) : (

                /* --- IDLE STATE (Inside the Creative Canvas) --- */
                <button 
                  onClick={handleGenerateImage}
                  // COMBINED LOGIC: Disable if loading, if no ID exists yet, OR if they are broke
                  disabled={loading || isGeneratingImage || !lastPostId || userCredits < 3} 
                  className={`flex flex-col items-center text-center group/btn active:scale-95 transition-all ${
                    (userCredits < 3 || loading || isGeneratingImage || !lastPostId) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm border flex items-center justify-center mb-4 transition-all ${
                    userCredits < 3 
                      ? 'border-slate-100' 
                      : 'border-slate-200 group-hover/btn:border-cyan-300 group-hover/btn:shadow-md'
                  }`}>
                    {/* Show a spinner if loading, otherwise show the icon */}
                    {(loading || isGeneratingImage) ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                    ) : (
                      <svg className={`w-8 h-8 ${userCredits < 3 ? 'text-slate-200' : 'text-slate-400 group-hover/btn:text-cyan-600'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  
                  <span className={`text-sm font-bold ${userCredits < 3 ? 'text-slate-400' : 'text-slate-900 group-hover/btn:text-cyan-700'}`}>
                    {isGeneratingImage ? "Designing..." : userCredits < 3 ? "Fill up credits" : "Generate Matching Image"}
                  </span>
                  
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                    {userCredits < 3 ? "Requires 3 Credits" : "Costs 3 Credits"}
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">AI Engine: Optimized</span>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase">
            {content.trim().split(/\s+/).filter(Boolean).length} Words
          </div>
        </div>
      </div>
    </div>
  )}

{showCalendarModal && (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    onClick={(e) => { if (e.target === e.currentTarget) setShowCalendarModal(false); }}
  >
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden mb-28 sm:mb-0">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600">Habit synced</p>
        <p className="text-base font-bold text-slate-900 mt-0.5">
          {strategy === "next" ? "Your reminder is ready" : "Your daily habit is set"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          A calendar file was just downloaded to your device. Here's how to add it:
        </p>
      </div>

    {/* iOS Instructions */}
    <div className="px-5 py-4 border-b border-slate-100">
      <p className="text-xs font-bold text-slate-700 mb-2">
        iPhone / iPad
      </p>
      <div className="space-y-1.5">
        {[
          "Open the Files app on your iPhone",
          'Find "Shoreline-post-alert.ics" in Downloads',
          "Tap the file — it opens Calendar automatically",
          'Tap "Add All Events" to confirm'
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-xs text-slate-500">{step}</span>
          </div>
        ))}
      </div>
    </div>

      {/* Android Instructions */}
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-700 mb-2">
          Android
        </p>
        <div className="space-y-1.5">
          {[
            "Pull down your notification bar",
            'Tap the downloaded "Shoreline-post-alert.ics"',
            "Choose Google Calendar or your calendar app",
            'Tap "Import" to add the events'
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-xs text-slate-500">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop shortcut */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-600">On desktop:</span> Double-click the downloaded file — it opens directly in your calendar app.
        </p>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex gap-2">
        <button
          onClick={() => {setShowCalendarModal(false);setStrategy("none");}}
          className="flex-1 py-2.5 rounded-xl bg-cyan-700 text-white text-sm font-bold hover:bg-cyan-800 transition-colors"
        >
          Got it
        </button>
        <button
          onClick={() => {
            setShowCalendarModal(false);
            handleSmartScheduleSubmit(); // re-download if needed
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          Re-download
        </button>
      </div>
    </div>
  </div>
)}

</div>  

); 
}