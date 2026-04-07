'use client';
import { useUser, useSession, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // Added for redirecting
import { SiteHeader } from "@/components/SiteHeader"; // Keep consistent branding
import { getFramework, BUSINESS_ARCHETYPES } from "@/lib/frameworks";
import { NICHE_DATA, CATEGORIES, VOICES } from "@/lib/constants";
import { createClerksupabase } from '@/lib/supabase';

let globalSupabase: any;

export default function ProfilePage() {
  // 1. Define all hooks
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const { getToken } = useAuth();
  const router = useRouter();

  // Initialize the supabase client
  const supabase = useMemo(() => {
    if (!globalSupabase) {
      globalSupabase = createClerksupabase(() => getToken({ template: 'supabase' }));
    }
    return globalSupabase;
  }, [getToken]);
  
  // STATES DEFINITIONS
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [business_name, setbusiness_name] = useState("");
  const [category, setCategory] = useState("");
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [voice, setVoice] = useState("");
  const [credits, setCredits] = useState("");

    // 4. Effects and Handlers
    useEffect(() => {
      const fetchProfile = async () => {
        if (!user?.id || !supabase) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
    
        if (data) {
          // If we found data in Supabase, use it
          setbusiness_name(data.business_name || "");
          setLocation(data.location || "");
          setCategory(data.category || "");
          setVoice(data.voice || "");
          setNiche(data.niche || "");
          setCredits(data.credits || "" )

        } else {
          // If no data in DB, check localStorage
          const saved = localStorage.getItem("mimico_business_profile");
          if (saved) {
            const localData = JSON.parse(saved);
            setbusiness_name(localData.business_name || "");
            setLocation(localData.location || "");
            setCategory(localData.category || "");
            setVoice(localData.voice || "");
            setNiche(localData.niche || "");
            setCredits(localData.credits || "")
          }
        }
      };
    
      if (isLoaded && user) {
        fetchProfile();
      }
    }, [isLoaded, user, supabase]);
    // 3. Early Return (Now 'session' is defined and safe to check)
    if (!isLoaded || !user || !session) {
      return <div className="p-10 text-center text-slate-500">Loading Profile...</div>;
    }

  const categories = Object.keys(BUSINESS_ARCHETYPES);
  const voices = ["The Expert", "The Neighbor", "The Hustler", "The Minimalist"];


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;
    
    setLoading(true);
    try {
      // We define the object HERE so both Supabase and LocalStorage can use it
      const profileData = {
        id: user.id,
        business_name :business_name,
        location: location,
        category: category,
        niche: niche,
        voice: voice,
        credits: 10,
        updated_at: new Date().toISOString(),
      };
  
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData); // Use the object here
  
      if (error) throw error;
  
      // Now this won't throw an error because profileData is defined above
      localStorage.setItem("mimico_business_profile", JSON.stringify(profileData));
  
      alert("SUCCESS! Mimico Profile Saved.");
      router.push("/dashboard");
  
    } catch (err: any) {
      console.error("Save failed:", err.message);
      alert("Save Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const runLogicCheck = () => {
    if (!category || !voice) {
      setTestResult("Please select a category and voice first!");
      return;
    }
    const result = getFramework(category, "5 Tips", voice); 
    const archetype = BUSINESS_ARCHETYPES[category];
    setTestResult(`Logic: ${category} is "${archetype}". Using ${voice} voice for "5 Tips" results in: ${result} framework.`);
  };

  if (!isLoaded) return <div className="p-10 text-center text-slate-500">Loading Profile...</div>;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="bento-card bg-white shadow-xl border-slate-200">
          <header className="mb-8 border-b border-slate-100 pb-6">
            <p className="text-sm font-medium uppercase tracking-wide text-cyan-800">Step 1: Setup</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Business Profile</h1>
            <p className="text-slate-600 mt-2">Tell the Mimico AI about your business to generate more accurate, local content.</p>
          </header>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">First Name</label>
                <input className="border border-slate-200 p-3 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" defaultValue={user?.firstName || ''} readOnly />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                <input className="border border-slate-200 p-3 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" defaultValue={user?.lastName || ''} readOnly />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-1">Business Name</label>
              <input 
                className="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition" 
                placeholder="e.g. San Remo Bakery" 
                value={business_name}
                onChange={(e) => setbusiness_name(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-1">Business Address (Location)</label>
              <input 
                className="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                placeholder="e.g. 2447 Lake Shore Blvd W, Toronto, ON" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-400 mt-1 italic">
                The AI uses this to research your neighborhood's landmarks and local trends.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">Business Category</label>
                <select 
                  className="border border-slate-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setNiche("");
                  }}
                  required
                >
                  <option value="">Select Category...</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">Business Niche (Trade)</label>
                <select 
                  className={`border border-slate-200 p-3 rounded-xl bg-white ${!category ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  disabled={!category} // Lock until category is picked [cite: 193]
                  required
                >
                  <option value="">{category ? "Select Trade..." : "Select Category First"}</option>
                  {category && NICHE_DATA[category].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">Brand Voice</label>
                <select 
                  className="border border-slate-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  required
                >
                  <option value="">Select Voice...</option>
                  {voices.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-4 rounded-xl transition shadow-lg ${
                loading ? 'bg-slate-400 cursor-wait' : 'bg-cyan-800 text-white hover:bg-cyan-900 active:transform active:scale-95'
              }`}
            >
              {loading ? 'Saving Your Identity...' : 'Save Profile & Open Dashboard'}
            </button>
          </form>

          {/* Logic Tester - styled as a "developer" utility */}
          <div className="mt-12 p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Framework Debugger</h3>
              <button 
                type="button"
                onClick={runLogicCheck}
                className="text-xs font-bold text-cyan-800 hover:underline"
              >
                Run Matrix Check
              </button>
            </div>
            {testResult ? (
              <div className="p-4 bg-slate-900 rounded-lg font-mono text-[10px] text-cyan-400 shadow-inner overflow-x-auto">
                {">"} {testResult}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No logic check performed yet.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
