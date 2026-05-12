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
      craft_identity: raw.craft_identity || "",
      neighbourhood: raw.neighbourhood || "",
      landmarks: Array.isArray(raw.landmarks) ? raw.landmarks : [],
      transit: Array.isArray(raw.transit) ? raw.transit : [],
      local_trends: Array.isArray(raw.local_trends) ? raw.local_trends : [],
      products_services: Array.isArray(raw.products_services) ? raw.products_services : [],
      
      // ✨ NEW: Interior and storefront data for MODE 3
      interior_layout: raw.interior_layout ? parseInteriorLayout(raw.interior_layout) : undefined,
      storefront_architecture: raw.storefront_architecture || undefined,
    };
  }
  
  // Fallback for stringified JSON
  try {
    const parsed = JSON.parse(raw);

    return {
      description: parsed.description || "",
      craft_identity: parsed.craft_identity || "",
      neighbourhood: parsed.neighbourhood || "",
      landmarks: Array.isArray(parsed.landmarks) ? parsed.landmarks : [],
      transit: Array.isArray(parsed.transit) ? parsed.transit : [],
      local_trends: Array.isArray(parsed.local_trends) ? parsed.local_trends : [],
      products_services: Array.isArray(parsed.products_services) ? parsed.products_services : [],
      
      // ✨ NEW: Interior and storefront data for MODE 3
      interior_layout: parsed.interior_layout ? parseInteriorLayout(parsed.interior_layout) : undefined,
      storefront_architecture: parsed.storefront_architecture || undefined,
    };
  } catch (e) {
    
    return { 

      description: raw,
      interior_layout: undefined,
      storefront_architecture: undefined,
    };
  }
}

/**
 * ✨ NEW: Helper function to parse interior_layout
 */
function parseInteriorLayout(data: any): any {
  if (!data) return undefined;
  
  // If it's already structured, return as-is
  if (typeof data === 'object' && !Array.isArray(data)) {
    return {
      counter_position: data.counter_position,
      seating_style_density: data.seating_style_density,
      open_plan_or_divided_spaces: data.open_plan_or_divided_spaces,
      lighting_mood: data.lighting_mood,
      distinctive_design_feature: data.distinctive_design_feature,
    };
  }
  
  // If it's a string, return as distinctive_design_feature
  if (typeof data === 'string') {
    return {
      distinctive_design_feature: data,
    };
  }
  
  return undefined;
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
  // Add new state for user profile
  const [userTier, setUserTier] = useState<number>(1);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [freeDiscoveryUsed, setFreeDiscoveryUsed] = useState<boolean>(false);
  const [runTextDiscovery, setRunTextDiscovery] = useState<boolean>(false);
  const [businessCount, setBusinessCount] = useState<number>(0);

  // Track original values to detect changes
  const [originalBusinessName, setOriginalBusinessName] = useState<string>("");
  const [originalStreet, setOriginalStreet] = useState<string>("");
  const [originalCity, setOriginalCity] = useState<string>("");

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

          setOriginalBusinessName(data.business_name || "");
          setOriginalStreet(data.street || "");
          setOriginalCity(data.city || "");

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

  // Fetch user profile (tier, credits)
useEffect(() => {
  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserTier(data.tier || 1);
        setUserCredits(data.credits || 0);
        setFreeDiscoveryUsed(data.free_text_discovery_used || false);
        console.log("User profile loaded:", data);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const fetchBusinessCount = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/user/businesses/count');
      if (response.ok) {
        const data = await response.json();
        setBusinessCount(data.count || 0);
        console.log("Business count:", data.count);
      }
    } catch (err) {
      console.error("Failed to fetch business count:", err);
    }
  };

  if (user?.id) {
    fetchUserProfile();
    fetchBusinessCount();
  }
}, [user?.id]);


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

      // --- ADD THIS TO PREVENT LEAKING PHOTOS FROM OLD BUSINESS ---
      setStorefrontPhoto(null);
      setLogoPhoto(null);
      setInteriorPhoto(null);
      
      toast.success(`Found existing data for "${data.business_name}"!`, { icon: '🔄' });
    }
  };

  const getDiscoveryCost = (): number => {
    if (userTier === 2) return 0; // Tier 2 is free
    if (!freeDiscoveryUsed) return 0; // First discovery free
    return 3; // Tier 1 subsequent discoveries
  };
   

  const categories = Object.keys(BUSINESS_ARCHETYPES);
  const voices = ["Authoritative & Precise", "Warm & Conversational", "Bold & Direct", "Clean & Understated"];

  
  // ── REFINED Save handler for intelligent toasts (More Concise) ──────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    // ─────────────────────────────────────────────────────────────────
    // VALIDATION: Tier 1 restrictions
    // ─────────────────────────────────────────────────────────────────
    if (userTier === 1) {
      // Block create mode if already has a business
      if (saveMode === 'create' && businessCount >= 1) {
        toast.error("Tier 1 users can only have one business. Please upgrade to Tier 2 for multiple businesses.");
        return;
      }
  
      // Check credits if text discovery is requested
      const discoveryCost = getDiscoveryCost();
      if (runTextDiscovery && discoveryCost > 0 && userCredits < discoveryCost) {
        toast.error(`Insufficient credits. You need ${discoveryCost} credits but have ${userCredits}.`);
        return;
      }
    }
  
    setLoading(true);
    const statusToast = toast.loading("💾 Saving your business profile...");

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
        p_mode: saveMode
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
          const filePath = `${user.id}/${businessId}/${label}-${Date.now()}.${file.name.split('.').pop()}`;
          const { error } = await supabase.storage.from('brand_assets').upload(filePath, file);
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('brand_assets').getPublicUrl(filePath);
            uploadedPhotoData.push({ url: publicUrl, mimeType: file.type, label });
          }
        }
      }

        // 3. Trigger Discovery API
        const shouldRunDiscovery = 
        (uploadedPhotoData.length > 0) ||  // Always run if photos uploaded (vision)
        (userTier === 1 && runTextDiscovery) ||  // Tier 1: only if checkbox checked
        (userTier === 2 && saveMode === 'create');  // Tier 2: only on first creat

      if (shouldRunDiscovery) {
        toast.loading("🤖 Running AI brand analysis...", { id: statusToast });

        const discoveryResponse = await fetch("/api/discover-brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: businessId,
            business_name,
            address: { street, city, province_state, country, postalCode },
            photos: uploadedPhotoData,
            category,
            niche,
            run_text_discovery: (userTier === 1 && runTextDiscovery) || (userTier === 2 && saveMode === 'create'),
          }),
        });

        if (!discoveryResponse.ok) {
          const errorData = await discoveryResponse.json();
          
          if (discoveryResponse.status === 402) {
            toast.error(`Insufficient credits: Need ${errorData.required}, have ${errorData.available}`, { id: statusToast });
            return;
          }
          
          throw new Error(errorData.error || "Discovery failed");
        }

        const discoveryResult = await discoveryResponse.json();
        
        // Update local credit count after successful discovery
        if (discoveryResult.credits_charged > 0) {
          setUserCredits(prev => prev - discoveryResult.credits_charged);
          toast.success(`AI analysis complete! (${discoveryResult.credits_charged} credits used)`, { id: statusToast });
        } else {
          toast.success("AI analysis completed & Business saved", { id: statusToast });
        }

        // Refresh user profile to get updated free_discovery_used status
        const profileResponse = await fetch('/api/user/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setFreeDiscoveryUsed(profileData.free_text_discovery_used);
        }
      } else {
        toast.success("Business details updated.", { id: statusToast });
      }

      // Reset checkbox after successful save
      setRunTextDiscovery(false);

      // Update original values
      setOriginalBusinessName(business_name);
      setOriginalStreet(street);
      setOriginalCity(city);

      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      toast.error("Save failed: " + err.message, { id: statusToast });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="p-10 text-center text-slate-500">Loading Profile...</div>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-0 sm:px-6 py-6 sm:py-16">
        <div className="bg-white shadow-none sm:shadow-xl border-y sm:border border-slate-200 sm:rounded-3xl p-6 sm:p-10">
        <header className="mb-8 border-b border-slate-100 pb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-800 bg-cyan-50 px-2 py-1 rounded inline-block mb-2">
                Step 1: Setup
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Your Business Profile
              </h1>
            </div>
            {/* Tier & Credits Display - Right aligned */}
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                {userTier === 2 ? "👑 Tier 2" : "🌟 Tier 1"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                💳 {userCredits} Credits
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            Tell the Shoreline AI about your business to generate more accurate, local content.
          </p>
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

            {/* Text Discovery Control - Always visible for Tier 1 */}
            {userTier === 1 && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="runTextDiscovery"
                    checked={runTextDiscovery}
                    onChange={(e) => setRunTextDiscovery(e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="runTextDiscovery" className="text-sm font-semibold text-purple-900 cursor-pointer flex items-center gap-2">
                      <span>🔍 Re-run Brand Discovery</span>
                      {getDiscoveryCost() === 0 ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          FREE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          3 CREDITS
                        </span>
                      )}
                    </label>
                    <p className="text-xs text-purple-700 mt-1.5 leading-relaxed">
                      {getDiscoveryCost() === 0 ? (
                        <>
                          <strong>🎁 Your first discovery is FREE!</strong> We'll research your business online to learn about your brand identity, neighborhood, and local context.
                        </>
                      ) : (
                        <>
                          Check this box to refresh your brand research. We'll search the web for updated information about your business, location, and local trends. <strong className="text-purple-900">Cost: 3 credits</strong>
                        </>
                      )}
                    </p>
                    {runTextDiscovery && getDiscoveryCost() > 0 && (
                      <div className="mt-2 text-[11px] text-purple-800 bg-purple-100 border border-purple-200 rounded-lg px-3 py-2">
                        ⚠️ <strong>Confirmation:</strong> 3 credits will be deducted when you save.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TIER 2: Mode Selector (update vs create) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {userTier === 2 && (
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Action
                </label>
                <select 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                  value={saveMode}
                  onChange={(e) => setSaveMode(e.target.value as 'update' | 'create')}
                >
                  <option value="update">Update current business details</option>
                  <option value="create">Create a new business</option>
                </select>
              </div>
            )}
                        
            {userTier === 2 && saveMode === 'create' && (
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="text-xl">👑</span>
                  <div>
                    <p className="text-sm font-semibold text-cyan-900">Tier 2 Premium - Auto Discovery</p>
                    <p className="text-xs text-cyan-700 mt-1">
                      Your brand research will automatically run when creating a new business. No credit charge for premium users!
                    </p>
                  </div>
                </div>
              </div>
            )}
            {userTier === 2 && saveMode === 'update' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💾</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Update Mode</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Your changes will be saved. Brand discovery will not re-run (use Create mode for new businesses with fresh discovery).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Brand Photos — 3-state section driven by brandSource ──────── */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Brand Photos</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload your own photos so the AI learns your exact brand visuals and style.
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
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-100 px-2 py-1 rounded-full mt-0.5">
                    Recommended
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

        </div>
      </main>
    </>
  );
}