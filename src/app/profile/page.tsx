'use client';
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { getFramework, BUSINESS_ARCHETYPES, type Framework, type PurchaseType } from "@/lib/frameworks";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState("");

  // Form States
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [voice, setVoice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("mimico_user_profile");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.businessName) setBusinessName(data.businessName);
      if (data.category) setCategory(data.category);
      if (data.voice) setVoice(data.voice);
    }
  }, []);

  const categories = Object.keys(BUSINESS_ARCHETYPES);
  const voices = ["The Expert", "The Neighbor", "The Hustler", "The Minimalist"];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    // 1. Create the data object to save
    // (Make sure these variable names match the ones in your Profile useState hooks!)
  const profileData = {
      businessName: businessName, 
      category: category,
      voice: voice,
      updatedAt: new Date().toISOString(),
    };
  
    try {
      // 2. Save it to LocalStorage using a unique key
      localStorage.setItem("mimico_user_profile", JSON.stringify(profileData));
  
      // 3. Keep your existing feedback logic
      alert("Profile settings saved! Your Dashboard will now auto-fill.");
      
    } catch (error) {
      console.error("Save failed:", error);
      alert("There was an error saving your profile.");
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

  if (!isLoaded) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-sm min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Business Profile</h1>
      <p className="text-gray-500 mb-8 border-b pb-4">Set your business context for the Mimico AI.</p>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">First Name</label>
            <input className="border p-2 rounded bg-gray-50" defaultValue={user?.firstName || ''} readOnly />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Last Name</label>
            <input className="border p-2 rounded bg-gray-50" defaultValue={user?.lastName || ''} readOnly />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Business Name</label>
          <input 
            className="border p-2 rounded" 
            placeholder="e.g. San Remo Bakery" 
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Business Category</label>
          <select 
            className="border p-2 rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category...</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Brand Voice</label>
          <select 
            className="border p-2 rounded"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          >
            <option value="">Select Voice...</option>
            {voices.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Saving...' : 'Save Profile Settings'}
        </button>
      </form>

      {/* --- TEST ENGINE UI --- */}
      <div className="mt-12 p-6 bg-blue-50 border-2 border-blue-100 rounded-xl">
        <h3 className="text-lg font-bold text-blue-900 mb-1">Framework Logic Tester</h3>
        <p className="text-sm text-blue-700 mb-4">Click to see which copywriting framework the AI will choose[cite: 21, 33].</p>
        
        <button 
          type="button"
          onClick={runLogicCheck}
          className="bg-white border border-blue-400 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition shadow-sm"
        >
          Run Logic Check
        </button>

        {testResult && (
          <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg font-mono text-xs text-blue-800 shadow-inner">
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
}
