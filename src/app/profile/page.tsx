'use client';
import { useUser, useSession, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // Added for redirecting
import { SiteHeader } from "@/components/SiteHeader"; // Keep consistent branding
import { getFramework, BUSINESS_ARCHETYPES } from "@/lib/frameworks";
import { NICHE_DATA, CATEGORIES, VOICES } from "@/lib/constants";
import { createClerksupabase } from '@/lib/supabase';
import toast from "react-hot-toast";

export default function ProfilePage() {
  // 1. Define all hooks
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const { getToken } = useAuth();
  const router = useRouter();

  // Initialize the supabase client

  // Updated - dynamic template based on environment
  const template = process.env.NEXT_PUBLIC_APP_ENV === 'development'
  ? 'supabase-dev'
  : 'supabase-prod';
  const supabase = useMemo(() => {
    
    return createClerksupabase(() => getToken({ template}));
  }, []); // Empty dependency array!

  // STATES DEFINITIONS
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [business_name, setbusiness_name] = useState("");
  const [category, setCategory] = useState("");
  const [niche, setNiche] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province_state, setProvinceState] = useState("");
  const [country, setCountry] = useState("Canada");
  const [postalCode, setPostalCode] = useState("");
  const [voice, setVoice] = useState("");
  const [credits, setCredits] = useState(0);

    // 4. Effects and Handlers
    useEffect(() => {
      const fetchProfile = async () => {
        if (!user?.id || !supabase) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('business_name, street, city, country, postal_code, province_state, category, niche, voice, credits')
          .eq('id', user.id)
          .maybeSingle();
    
        console.log('Profile fetch:', { data, error });

        if (data) {
          // If we found data in Supabase, use it
          setbusiness_name(data.business_name || "");
          setStreet(data.street || "");
          setCity(data.city || "");
          setProvinceState(data.province_state || "");
          setCountry(data.country || "Canada");
          setPostalCode(data.postal_code || "");
          setCategory(data.category || "");
          setVoice(data.voice || "");
          setNiche(data.niche || "");
          setCredits(data.credits ?? 0)

        } else {
          // If no data in DB, check localStorage
          const saved = localStorage.getItem("shoreline_business_profile");
          if (saved) {
            const localData = JSON.parse(saved);
            setbusiness_name(localData.business_name || "");
            setStreet(localData.street || "");
            setCity(localData.city || "");
            setCountry(localData.country || "Canada");
            setPostalCode(localData.postal_code || "");
            setCategory(localData.category || "");
            setVoice(localData.voice || "");
            setNiche(localData.niche || "");
            setCredits(localData.credits ?? 0)
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
  const voices = ["The Expert", "The Neighbour", "The Hustler", "The Minimalist"];


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;
    
    setLoading(true);
    try {
      // We define the object HERE so both Supabase and LocalStorage can use it
      const profileData = {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.primaryEmailAddress?.emailAddress,
        business_name :business_name,
        street: street,
        city: city,
        province_state: province_state,
        country: country,
        postal_code: postalCode,
        category: category,
        niche: niche,
        voice: voice,
        updated_at: new Date().toISOString(),
      };
  
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData); // Use the object here
  
      if (error) throw error;

      // 2. TRIGGER: Call the RPC to claim welcome credits
      // This is the "Hybrid" logic we discussed
      const { data: creditData, error: creditError } = await supabase.rpc('claim_welcome_credits');
      
      if (creditError) {
        console.error("Credit claim error:", creditError);
        // We don't throw this error because the profile was still saved successfully
      } else if (creditData?.success) {
        toast.success("Welcome! 15 free credits have been added to your account! 🚀");
      }else if (creditData && creditData.success === false) {

        toast.error(creditData.message || "Unable to grant welcome credits.");
      }
  
      // Now this won't throw an error because profileData is defined above
      localStorage.setItem("shoreline_business_profile", JSON.stringify(profileData));
  
      alert("SUCCESS! Shoreline Profile Saved.");
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
      <main className="mx-auto max-w-3xl px-0 sm:px-6 py-6 sm:py-16">
        <div className="bg-white shadow-none sm:shadow-xl border-y sm:border border-slate-200 sm:rounded-3xl p-6 sm:p-10">
          <header className="mb-8 border-b border-slate-100 pb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-800 bg-cyan-50 px-2 py-1 rounded inline-block mb-2">Step 1: Setup</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Your Business Profile</h1>
            <p className="text-slate-500 text-sm mt-2">Tell the Shoreline AI about your business to generate more accurate, local content.</p>
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


            {/* DECONSTRUCTED ADDRESS SECTION */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700">Business Location</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-[10px] uppercase text-slate-400 mb-1 ml-1">Street Address</label>
                  <input 
                    className="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                    placeholder="e.g. 2447 Lake Shore Blvd W" 
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase text-slate-400 mb-1 ml-1">City</label>
                  <input 
                    className="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                    placeholder="e.g. Toronto" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Province / State</label>
                  <input 
                    className="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                    placeholder="e.g. ON or Ontario" 
                    value={province_state}
                    onChange={(e) => setProvinceState(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase text-slate-400 mb-1 ml-1">Country</label>
                  <select 
                    className="border border-slate-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  >
                    <option value="Other">Other</option>
                    <option value="Canada">Canada 🇨🇦</option>
                    <option value="USA">USA 🇺🇸</option>
                    <option value="Afghanistan">Afghanistan 🇦🇫</option>
                    <option value="Albania">Albania 🇦🇱</option>
                    <option value="Algeria">Algeria 🇩🇿</option>
                    <option value="Andorra">Andorra 🇦🇩</option>
                    <option value="Angola">Angola 🇦🇴</option>
                    <option value="Argentina">Argentina 🇦🇷</option>
                    <option value="Armenia">Armenia 🇦🇲</option>
                    <option value="Australia">Australia 🇦🇺</option>
                    <option value="Austria">Austria 🇦🇹</option>
                    <option value="Azerbaijan">Azerbaijan 🇦🇿</option>
                    <option value="Bahamas">Bahamas 🇧🇸</option>
                    <option value="Bahrain">Bahrain 🇧🇭</option>
                    <option value="Bangladesh">Bangladesh 🇧🇩</option>
                    <option value="Barbados">Barbados 🇧🇧</option>
                    <option value="Belarus">Belarus 🇧🇾</option>
                    <option value="Belgium">Belgium 🇧🇪</option>
                    <option value="Belize">Belize 🇧🇿</option>
                    <option value="Benin">Benin 🇧🇯</option>
                    <option value="Bhutan">Bhutan 🇧🇹</option>
                    <option value="Bolivia">Bolivia 🇧🇴</option>
                    <option value="Bosnia and Herzegovina">Bosnia and Herzegovina 🇧🇦</option>
                    <option value="Botswana">Botswana 🇧🇼</option>
                    <option value="Brazil">Brazil 🇧🇷</option>
                    <option value="Brunei">Brunei 🇧🇳</option>
                    <option value="Bulgaria">Bulgaria 🇧🇬</option>
                    <option value="Burkina Faso">Burkina Faso 🇧🇫</option>
                    <option value="Burundi">Burundi 🇧🇮</option>
                    <option value="Cambodia">Cambodia 🇰🇭</option>
                    <option value="Cameroon">Cameroon 🇨🇲</option>
                    <option value="Cape Verde">Cape Verde 🇨🇻</option>
                    <option value="Central African Republic">Central African Republic 🇨🇫</option>
                    <option value="Chad">Chad 🇹🇩</option>
                    <option value="Chile">Chile 🇨🇱</option>
                    <option value="China">China 🇨🇳</option>
                    <option value="Colombia">Colombia 🇨🇴</option>
                    <option value="Comoros">Comoros 🇰🇲</option>
                    <option value="Congo">Congo 🇨🇬</option>
                    <option value="Costa Rica">Costa Rica 🇨🇷</option>
                    <option value="Croatia">Croatia 🇭🇷</option>
                    <option value="Cuba">Cuba 🇨🇺</option>
                    <option value="Cyprus">Cyprus 🇨🇾</option>
                    <option value="Czech Republic">Czech Republic 🇨🇿</option>
                    <option value="Denmark">Denmark 🇩🇰</option>
                    <option value="Djibouti">Djibouti 🇩🇯</option>
                    <option value="Dominica">Dominica 🇩🇲</option>
                    <option value="Dominican Republic">Dominican Republic 🇩🇴</option>
                    <option value="Ecuador">Ecuador 🇪🇨</option>
                    <option value="Egypt">Egypt 🇪🇬</option>
                    <option value="El Salvador">El Salvador 🇸🇻</option>
                    <option value="Equatorial Guinea">Equatorial Guinea 🇬🇶</option>
                    <option value="Eritrea">Eritrea 🇪🇷</option>
                    <option value="Estonia">Estonia 🇪🇪</option>
                    <option value="Eswatini">Eswatini 🇸🇿</option>
                    <option value="Ethiopia">Ethiopia 🇪🇹</option>
                    <option value="Fiji">Fiji 🇫🇯</option>
                    <option value="Finland">Finland 🇫🇮</option>
                    <option value="France">France 🇫🇷</option>
                    <option value="Gabon">Gabon 🇬🇦</option>
                    <option value="Gambia">Gambia 🇬🇲</option>
                    <option value="Georgia">Georgia 🇬🇪</option>
                    <option value="Germany">Germany 🇩🇪</option>
                    <option value="Ghana">Ghana 🇬🇭</option>
                    <option value="Greece">Greece 🇬🇷</option>
                    <option value="Grenada">Grenada 🇬🇩</option>
                    <option value="Guatemala">Guatemala 🇬🇹</option>
                    <option value="Guinea">Guinea 🇬🇳</option>
                    <option value="Guyana">Guyana 🇬🇾</option>
                    <option value="Haiti">Haiti 🇭🇹</option>
                    <option value="Honduras">Honduras 🇭🇳</option>
                    <option value="Hungary">Hungary 🇭🇺</option>
                    <option value="Iceland">Iceland 🇮🇸</option>
                    <option value="India">India 🇮🇳</option>
                    <option value="Indonesia">Indonesia 🇮🇩</option>
                    <option value="Iran">Iran 🇮🇷</option>
                    <option value="Iraq">Iraq 🇮🇶</option>
                    <option value="Ireland">Ireland 🇮🇪</option>
                    <option value="Israel">Israel 🇮🇱</option>
                    <option value="Italy">Italy 🇮🇹</option>
                    <option value="Jamaica">Jamaica 🇯🇲</option>
                    <option value="Japan">Japan 🇯🇵</option>
                    <option value="Jordan">Jordan 🇯🇴</option>
                    <option value="Kazakhstan">Kazakhstan 🇰🇿</option>
                    <option value="Kenya">Kenya 🇰🇪</option>
                    <option value="Korea, South">South Korea 🇰🇷</option>
                    <option value="Kuwait">Kuwait 🇰🇼</option>
                    <option value="Latvia">Latvia 🇱🇻</option>
                    <option value="Lebanon">Lebanon 🇱🇧</option>
                    <option value="Libya">Libya 🇱🇾</option>
                    <option value="Lithuania">Lithuania 🇱🇹</option>
                    <option value="Luxembourg">Luxembourg 🇱🇺</option>
                    <option value="Malaysia">Malaysia 🇲🇾</option>
                    <option value="Maldives">Maldives 🇲🇻</option>
                    <option value="Mexico">Mexico 🇲🇽</option>
                    <option value="Monaco">Monaco 🇲🇨</option>
                    <option value="Morocco">Morocco 🇲🇦</option>
                    <option value="Netherlands">Netherlands 🇳🇱</option>
                    <option value="New Zealand">New Zealand 🇳🇿</option>
                    <option value="Nigeria">Nigeria 🇳🇬</option>
                    <option value="Norway">Norway 🇳🇴</option>
                    <option value="Pakistan">Pakistan 🇵🇰</option>
                    <option value="Peru">Peru 🇵🇪</option>
                    <option value="Philippines">Philippines 🇵🇭</option>
                    <option value="Poland">Poland 🇵🇱</option>
                    <option value="Portugal">Portugal 🇵🇹</option>
                    <option value="Qatar">Qatar 🇶🇦</option>
                    <option value="Romania">Romania 🇷🇴</option>
                    <option value="Russia">Russia 🇷🇺</option>
                    <option value="Saudi Arabia">Saudi Arabia 🇸🇦</option>
                    <option value="Singapore">Singapore 🇸🇬</option>
                    <option value="South Africa">South Africa 🇿🇦</option>
                    <option value="Spain">Spain 🇪🇸</option>
                    <option value="Sweden">Sweden 🇸🇪</option>
                    <option value="Switzerland">Switzerland 🇨🇭</option>
                    <option value="Thailand">Thailand 🇹🇭</option>
                    <option value="Turkey">Turkey 🇹🇷</option>
                    <option value="Ukraine">Ukraine 🇺🇦</option>
                    <option value="United Arab Emirates">United Arab Emirates 🇦🇪</option>
                    <option value="United Kingdom">United Kingdom 🇬🇧</option>
                    <option value="Vietnam">Vietnam 🇻🇳</option>                
                  </select>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-[10px] uppercase text-slate-400 mb-1 ml-1">Postal / Zip Code</label>
                  <input 
                    className="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                    placeholder="e.g. M8V 1E5" 
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                The AI uses this structured data to research your neighbourhood's landmarks and local trends.
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
              className={`w-full font-bold py-5 rounded-2xl transition shadow-lg ${
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
