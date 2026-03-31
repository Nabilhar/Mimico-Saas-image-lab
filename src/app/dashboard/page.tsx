"use client";
import { useUser} from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GenerateDashboard } from "@/components/GenerateDashboard";

interface Post {
  id: string;
  content: string;
  date: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [businessData, setBusinessData] = useState<Post[]>([]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem("mimico_business_profile");
      if (saved) setBusinessData(JSON.parse(saved));
    }
  }, [user]);

  const addPostToHistory = (newContent: string) => {
    const saved = localStorage.getItem("mimico_business_profile");
    const currentData = saved ? JSON.parse(saved) : { history: [] };

    const newPost: Post = {
      id: crypto.randomUUID(),
      content: newContent,
      date: new Date().toLocaleString(),
    };
    const updatedData = {
      ...currentData,
      history: [newPost, ...(currentData.history || [])]
    };


  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Content Studio</h1>
          <p className="text-slate-500">Generate and manage your Mimico social media drafts.</p>
        </header>

        <div className="space-y-8">
          <section className="bento-card border-cyan-100 bg-white shadow-sm">
            <GenerateDashboard onGenerateSuccess={addPostToHistory} />
          </section>

        </div>
      </main>
    </>
  );
}
