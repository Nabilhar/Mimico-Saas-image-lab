//Profile page

'use client';
import { useUser, useSession, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getFramework, BUSINESS_ARCHETYPES } from "@/lib/frameworks";
import { NICHE_DATA, CATEGORIES, VOICES } from "@/lib/constants";
import { createClerksupabase } from '@/lib/supabase';
import { UploadedPhoto } from "@/lib/brandDiscovery";
import toast from "react-hot-toast";


// ---------------------------------------------------------------------------
// Sub-component: a single photo upload slot with preview
// ---------------------------------------------------------------------------
interface PhotoSlotProps {
  label: string;
  sublabel: string;
  icon: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

function PhotoSlot({ label, sublabel, icon, file, onChange }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
        {icon} {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition overflow-hidden h-32
          ${file
            ? "border-cyan-400 bg-cyan-50"
            : "border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-cyan-50/50"
          }`}
      >
        {previewUrl ? (
          // Show thumbnail preview once a file is selected
          <>
            <img
              src={previewUrl}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            />
            {/* Overlay with change/remove controls */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition rounded-2xl">
              <span className="text-white text-xs font-semibold">Change photo</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-red-300 text-[10px] hover:text-red-100 underline"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400 pointer-events-none px-4 text-center">
            <span className="text-2xl">{icon}</span>
            <span className="text-[11px] font-semibold text-slate-500">{sublabel}</span>
            <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}

// Add this helper function inside your ProfilePage.tsx file
function parseBusinessIntel(raw: any) {
  if (!raw) return null;
  // If it's already an object (from the DB), just use it.
  if (typeof raw === 'object' && raw !== null) {
    return {
      description: raw.description || "",
      // You can add other fields here if needed later
    };
  }
  // Fallback for stringified JSON
  try {
    const parsed = JSON.parse(raw);
    return {
      description: parsed.description || "",
    };
  } catch (e) {
    // Fallback for legacy plain text descriptions
    return { description: raw };
  }
}

// ---------------------------------------------------------------------------
// Main Profile Page
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const { getToken } = useAuth();
  const router = useRouter();

  const template = process.env.NEXT_PUBLIC_APP_ENV === 'development'
    ? 'supabase-dev'
    : 'supabase-prod';

  const supabase = useMemo(() => {
    return createClerksupabase(() => getToken({ template }));
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
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
  const [business_description, setBusinessDescription] = useState("");
  const [saveMode, setSaveMode] = useState<'update' | 'create'>('update');

  // ── Photo upload state (3 optional slots) ─────────────────────────────────
  const [storefrontPhoto, setStorefrontPhoto] = useState<File | null>(null);
  const [logoPhoto, setLogoPhoto] = useState<File | null>(null);
  const [interiorPhoto, setInteriorPhoto] = useState<File | null>(null);

  // ── Brand source state — drives which UI the photo section shows ─────────
  // null        = first visit, discovery hasn't run yet
  // 'photos'    = real colors captured from owner photos ✅
  // 'text_search' = estimated colors from Gemma web research (upgradeable)
  const [brandSource, setBrandSource] = useState<string | null>(null);

  // ── Fetch existing profile ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchActiveBusiness = async () => {
      // Guard: only run if user/supabase ready AND profile not already loaded
      if (!user?.id || !supabase || profileLoaded) {
        console.log("Skipping business fetch: User, Supabase not ready, or already loaded.");
        return;
      }

      try {
        // --- THIS IS THE KEY CHANGE ---
        // We now call the SQL function to get the user's active business.
        // Define the shape of the business data coming from your SQL function
        type BusinessData = {
          business_name: string;
          street: string;
          city: string;
          province_state: string;
          country: string;
          postal_code: string;
          category: string;
          niche: string;
          voice: string;
          brand_source: string;
          business_description: any; // 'any' works here because we parse it next
        };

        const { data, error } = await supabase
          .rpc('get_active_business', { p_user_id: user.id })
          .single<BusinessData>();

        console.log('Active Business fetch:', { data, error });

        if (error) {
          console.error("Supabase active business fetch error:", error.message);
          toast.error("Error loading business: " + error.message);
        } else if (data) {
          // Note: The 'business_description' from the DB is now a JSON object.
          const intel = parseBusinessIntel(data.business_description);

          setbusiness_name(data.business_name || "");
          setStreet(data.street || "");
          setCity(data.city || "");
          setProvinceState(data.province_state || "");
          setCountry(data.country || "Canada");
          setPostalCode(data.postal_code || "");
          setCategory(data.category || "");
          setVoice(data.voice || "");
          setNiche(data.niche || "");
          setBrandSource(data.brand_source || null);
          
          // We set the business description from the parsed JSON 'description' field.
          setBusinessDescription(intel?.description || ""); 

          setProfileLoaded(true);
        } else {
          // No active business found for this user. This might be a new user.
          console.log("No active business found for this user.");
          setProfileLoaded(true); // Still set to true to unblock the UI.
        }

      } catch (err) {
        console.error("Catch block error fetching business:", err);
        toast.error("An unexpected error occurred while loading your business profile.");
      }
    };

    if (isLoaded && user?.id && supabase && !profileLoaded) {
      console.log("Attempting to fetch active business...");
      fetchActiveBusiness();
    }

  }, [isLoaded, user?.id, supabase, profileLoaded]); // Dependencies remain the same


  if (!isLoaded || !user || !session || !profileLoaded) { 
    return <div className="p-10 text-center text-slate-500">Loading Profile...</div>;
  }

  const fetchBusinessByName = async (name: string) => {
    if (!name || !user?.id) return;

    // Search for a business with this exact name owned by the user
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .eq('business_name', name.trim())
      .maybeSingle();

    if (data && !error) {
      // 1. Switch the active row in the database IMMEDIATELY
      await supabase.rpc('switch_active_business', { p_user_id: user.id, p_business_id: data.id });

      // 2. Populate the form
      setStreet(data.street || "");
      setCity(data.city || "");
      setProvinceState(data.province_state || "");
      setCountry(data.country || "Canada");
      setPostalCode(data.postal_code || "");
      setCategory(data.category || "");
      setVoice(data.voice || "");
      setNiche(data.niche || "");
      setBusinessDescription(data.business_description?.description || "");
      
      toast.success(`Found existing data for "${data.business_name}"!`, { icon: '🔄' });
    }
  };

  const categories = Object.keys(BUSINESS_ARCHETYPES);
  const voices = ["Authoritative & Precise", "Warm & Conversational", "Bold & Direct", "Clean & Understated"];

  
  // ── REFINED Save handler for intelligent toasts (More Concise) ──────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    setLoading(true);
    const statusToast = toast.loading("Saving...");

    try {
      // 1. RPC Call
      const { data: businessId, error: rpcError } = await supabase.rpc('switch_or_create_business', {
        p_user_id: user.id,
        p_business_name: business_name,
        p_street: street,
        p_city: city,
        p_province_state: province_state,
        p_country: country,
        p_postal_code: postalCode,
        p_category: category,
        p_niche: niche,
        p_voice: voice,
        p_mode: 'update'
      });
      if (rpcError) throw rpcError;

      // 2. Upload Photos
      const uploadedPhotoData: UploadedPhoto[] = [];
      const selectedFiles = [
        { file: storefrontPhoto, label: "storefront" },
        { file: logoPhoto,       label: "logo"       },
        { file: interiorPhoto,   label: "interior"   },
      ].filter((p) => p.file !== null) as { file: File; label: string }[];

      if (selectedFiles.length > 0) {
        for (const { file, label } of selectedFiles) {
          const filePath = `${businessId}/${label}-${Date.now()}.${file.name.split('.').pop()}`;
          const { error } = await supabase.storage.from('brand_assets').upload(filePath, file);
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('brand_assets').getPublicUrl(filePath);
            uploadedPhotoData.push({ url: publicUrl, mimeType: file.type, label });
          }
        }
      }

      // 3. Conditional Discovery Trigger
      // Trigger if it's a NEW business OR if we have photos to analyze
      const needsDiscovery = (saveMode === 'create') || (uploadedPhotoData.length > 0);

      if (needsDiscovery) {
        await fetch("/api/discover-brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: businessId,
            business_name,
            address: { street, city, province_state, country, postalCode },
            photos: uploadedPhotoData,
            category,
            niche,
          }),
        });
        toast.success("Business saved & AI analysis running...", { id: statusToast });
      } else {
        toast.success("Business details updated.", { id: statusToast });
      }

      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      toast.error("Save failed: " + err.message, { id: statusToast });
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

  // ── Render ─────────────────────────────────────────────────────────────────
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

            {/* ── Name fields ─────────────────────────────────────────────── */}
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

            {/* ── Business name ────────────────────────────────────────────── */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-1">Business Name</label>
              <input
                className="border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                placeholder="e.g. San Remo Bakery"
                value={business_name}
                onChange={(e) => setbusiness_name(e.target.value)}
                // Trigger the search when they finish typing
                onBlur={() => fetchBusinessByName(business_name)}
                required
              />
            </div>

            {/* ── Address ──────────────────────────────────────────────────── */}
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
                    <option value="Canada">Canada</option>
                    <option value="USA">USA</option>
                    <option value="Afghanistan">Afghanistan</option>
                    <option value="Albania">Albania</option>
                    <option value="Algeria">Algeria</option>
                    <option value="Andorra">Andorra</option>
                    <option value="Angola">Angola</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Armenia">Armenia</option>
                    <option value="Australia">Australia</option>
                    <option value="Austria">Austria</option>
                    <option value="Azerbaijan">Azerbaijan</option>
                    <option value="Bahamas">Bahamas</option>
                    <option value="Bahrain">Bahrain</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Barbados">Barbados</option>
                    <option value="Belarus">Belarus</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Belize">Belize</option>
                    <option value="Benin">Benin</option>
                    <option value="Bhutan">Bhutan</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                    <option value="Botswana">Botswana</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Brunei">Brunei</option>
                    <option value="Bulgaria">Bulgaria</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Burundi">Burundi</option>
                    <option value="Cambodia">Cambodia</option>
                    <option value="Cameroon">Cameroon</option>
                    <option value="Cape Verde">Cape Verde</option>
                    <option value="Central African Republic">Central African Republic</option>
                    <option value="Chad">Chad</option>
                    <option value="Chile">Chile</option>
                    <option value="China">China</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Comoros">Comoros</option>
                    <option value="Congo">Congo</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="Croatia">Croatia</option>
                    <option value="Cuba">Cuba</option>
                    <option value="Cyprus">Cyprus</option>
                    <option value="Czech Republic">Czech Republic</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Djibouti">Djibouti</option>
                    <option value="Dominica">Dominica</option>
                    <option value="Dominican Republic">Dominican Republic</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="Egypt">Egypt</option>
                    <option value="El Salvador">El Salvador</option>
                    <option value="Equatorial Guinea">Equatorial Guinea</option>
                    <option value="Eritrea">Eritrea</option>
                    <option value="Estonia">Estonia</option>
                    <option value="Eswatini">Eswatini</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="Fiji">Fiji</option>
                    <option value="Finland">Finland</option>
                    <option value="France">France</option>
                    <option value="Gabon">Gabon</option>
                    <option value="Gambia">Gambia</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Germany">Germany</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Greece">Greece</option>
                    <option value="Grenada">Grenada</option>
                    <option value="Guatemala">Guatemala</option>
                    <option value="Guinea">Guinea</option>
                    <option value="Guyana">Guyana</option>
                    <option value="Haiti">Haiti</option>
                    <option value="Honduras">Honduras</option>
                    <option value="Hungary">Hungary</option>
                    <option value="Iceland">Iceland</option>
                    <option value="India">India</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Iran">Iran</option>
                    <option value="Iraq">Iraq</option>
                    <option value="Ireland">Ireland</option>
                    <option value="Israel">Israel</option>
                    <option value="Italy">Italy</option>
                    <option value="Jamaica">Jamaica</option>
                    <option value="Japan">Japan</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Kazakhstan">Kazakhstan</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Korea, South">South Korea</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Latvia">Latvia</option>
                    <option value="Lebanon">Lebanon</option>
                    <option value="Libya">Libya</option>
                    <option value="Lithuania">Lithuania</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Maldives">Maldives</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Monaco">Monaco</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Norway">Norway</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Peru">Peru</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Poland">Poland</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Romania">Romania</option>
                    <option value="Russia">Russia</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Spain">Spain</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Ukraine">Ukraine</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Vietnam">Vietnam</option>
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

            {/* ── Category / Niche / Voice ──────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">Business Category</label>
                <select
                  className="border border-slate-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setNiche(""); }}
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
                  disabled={!category}
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

            {/* ── dropdown 'update' | 'create' ─────────────────────────────── */}
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Action</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                value={saveMode}
                onChange={(e) => setSaveMode(e.target.value as 'update' | 'create')}
              >
                <option value="update">Update current business details</option>
                <option value="create">Create a new business</option>
              </select>
            </div>

            {/* ── Brand Photos — 3-state section driven by brandSource ──────── */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Brand Photos</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload your own photos so the AI learns your exact brand colors and style.
                  </p>
                </div>
                {/* Badge changes based on what we know */}
                {brandSource === "photos" ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full mt-0.5">
                    ✅ Captured
                  </span>
                ) : brandSource === "text_search" ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full mt-0.5">
                    ⚡ Estimated
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-full mt-0.5">
                    Optional
                  </span>
                )}
              </div>

              {/* STATE 1: Brand captured from real photos — hide slots, show success */}
              {brandSource === "photos" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                  <span className="text-2xl">🎨</span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Brand identity captured from your photos</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      The AI has analyzed your storefront, logo, and hero product to extract your exact brand colors and style.
                    </p>
                    <button
                      type="button"
                      onClick={() => setBrandSource(null)}
                      className="text-[11px] text-emerald-600 underline mt-2 hover:text-emerald-800"
                    >
                      Re-upload photos to refresh brand analysis
                    </button>
                  </div>
                </div>

              ) : brandSource === "text_search" ? (
                /* STATE 2: Estimated from web — show slots with upgrade nudge */
                <>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 mb-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Brand colors were estimated from web research</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Upload your actual photos below for a more accurate brand analysis. Real photos always win.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <PhotoSlot label="Storefront" sublabel="Exterior / signage" icon="🏪" file={storefrontPhoto} onChange={setStorefrontPhoto} />
                    <PhotoSlot label="Logo" sublabel="Your brand mark" icon="✦" file={logoPhoto} onChange={setLogoPhoto} />
                    <PhotoSlot label="Interior" sublabel="Main space / layout" icon="⭐" file={interiorPhoto} onChange={setInteriorPhoto} />
                  </div>
                  {storefrontPhoto || logoPhoto || interiorPhoto ? (
                    <p className="text-[11px] text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-xl px-3 py-2">
                      ✅ The AI will re-analyze your brand using these photos after saving.
                    </p>
                  ) : null}
                </>

              ) : (
                /* STATE 3: First visit — neutral upload slots, no pressure */
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <PhotoSlot label="Storefront" sublabel="Exterior / signage" icon="🏪" file={storefrontPhoto} onChange={setStorefrontPhoto} />
                    <PhotoSlot label="Logo" sublabel="Your brand mark" icon="✦" file={logoPhoto} onChange={setLogoPhoto} />
                    <PhotoSlot label="Interior" sublabel="Main space / layout" icon="🪑" file={interiorPhoto} onChange={setInteriorPhoto} />
                  </div>
                  {storefrontPhoto || logoPhoto || interiorPhoto ? (
                    <p className="text-[11px] text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-xl px-3 py-2">
                      ✅ The AI will analyze your photos to extract your exact brand colors and style after saving.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No photos? No problem — the AI will research your business online as a fallback.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Save button ───────────────────────────────────────────────── */}
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

          {/* ── Framework Debugger ────────────────────────────────────────── */}
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