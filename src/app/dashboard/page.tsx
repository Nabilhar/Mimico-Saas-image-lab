"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GenerateDashboard } from "@/components/GenerateDashboard";

interface Post {
  id: string;
  content: string;
  date: string;
}

interface BusinessData {
  businessName: string;
  category: string;
  voice: string;
  history: Post[];
}

export default function DashboardPage() {
  const { user } = useUser();
  
  // FIX 1: Set the state to hold the BusinessData object, not just an array
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem("mimico_business_profile");
      if (saved) {
        setBusinessData(JSON.parse(saved));
      }
    }
  }, [user]);

  const addPostToHistory = (newContent: string) => {
    // We get the fresh data from LocalStorage to ensure we have the full profile
    const saved = localStorage.getItem("mimico_business_profile");
    const currentData: BusinessData = saved 
      ? JSON.parse(saved) 
      : { businessName: "", category: "", voice: "", history: [] };

    // FIX 2: Only declare newPost ONCE
    const newPost: Post = {
      id: crypto.randomUUID(),
      content: newContent,
      date: new Date().toLocaleString(),
    };

    // 3. Merge history into the full profile object
    const updatedData: BusinessData = {
      ...currentData,
      history: [newPost, ...(currentData.history || [])]
    };

    // 4. Save to LocalStorage and Update State
    localStorage.setItem("mimico_business_profile", JSON.stringify(updatedData));
    setBusinessData(updatedData);
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Content Studio</h1>
            <p className="text-slate-500">
              Managing drafts for <span className="text-cyan-800 font-semibold">{businessData?.businessName || "Your Business"}</span>
            </p>
          </div>

          {/* Read-only Badge for Category */}
          {businessData?.category && (
            <div className="bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-full">
              <p className="text-xs font-bold text-cyan-800 uppercase tracking-widest">{businessData.category}</p>
            </div>
          )}
        </header>

        <div className="space-y-8">
          <section className="bento-card border-cyan-100 bg-white shadow-sm">
            <GenerateDashboard onGenerateSuccess={addPostToHistory} />
          </section>

          {/* History Display */}
          {businessData?.history && businessData.history.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businessData.history.map((post) => (
                <div key={post.id} className="bento-card-muted p-4 text-sm bg-slate-50/50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-2 font-mono uppercase">{post.date}</p>
                  <p className="text-slate-700 whitespace-pre-wrap line-clamp-6">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}