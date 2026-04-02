"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GenerateDashboard } from "@/components/GenerateDashboard";
import { createClerkSupabaseClient } from '@/lib/supabaseClient';
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  content: string;
  created_at: string;
  business_id: string;
}

interface BusinessData {
  business_name: string;
  location: string;
  category: string;
  niche: string;
  voice: string;
  history: Post[];
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");

  // 1. THE LOAD FUNCTION
  const loadBusinessData = useCallback(async () => {
    if (!user?.id) return;
    console.log("🔍 DEBUG: Starting data load for user:", user.id);
    setLoading(true);
    
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createClerkSupabaseClient(token || "");

      const [profileRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('posts').select('*').eq('business_id', user.id).order('created_at', { ascending: false })
      ]);

      // --- THE NEW REDIRECT LOGIC ---
      if (!profileRes.data) {
        console.log("⚠️ No profile found. Redirecting to onboarding...");
        router.push('/profile'); // This kicks the user to setup if 'Orali' doesn't exist
        return; 
      }

      if (profileRes.data) {
        const formattedData: BusinessData = {
          business_name: profileRes.data.business_name,
          location: profileRes.data.location,
          category: profileRes.data.category,
          voice: profileRes.data.voice,
          niche: profileRes.data.niche,
          history: postsRes.data || []
        };
        setBusinessData(formattedData);
        setPosts(postsRes.data || []);
        localStorage.setItem("mimico_business_profile", JSON.stringify(formattedData));
      } else {
        console.log("⚠️ No profile found in database.");
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, getToken]);

  // 2. THE TRIGGER (This was missing!)
  useEffect(() => {
    if (isLoaded && user) {
      loadBusinessData();
    }
  }, [isLoaded, user, loadBusinessData]);

  // 3. SAVE LOGIC
  const savePostToCloud = useCallback(async (newContent: string) => {
    if (!user?.id) return;
    
    const tempId = 'temp-' + Date.now();
    const temporaryPost: Post = {
      id: tempId,
      content: newContent,
      created_at: new Date().toISOString(),
      business_id: user.id
    };
    setPosts(prev => [temporaryPost, ...prev]);
    setActiveTab("saved"); 

    setLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createClerkSupabaseClient(token || "");

      const { error } = await supabase
        .from("posts")
        .insert([{ content: newContent, business_id: user.id }]);

      if (error) {
        setPosts(prev => prev.filter(p => p.id !== tempId));
        alert("Database Error: Sync failed.");
      } else {
        loadBusinessData();
      }
    } catch (err) {
      console.error("Save crash:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, getToken, loadBusinessData]);

  // 4. LISTENER
  useEffect(() => {
    const handleAutoSave = (event: any) => {
      if (event.detail.content) savePostToCloud(event.detail.content);
    };
    window.addEventListener('save-mimico-post', handleAutoSave);
    return () => window.removeEventListener('save-mimico-post', handleAutoSave);
  }, [savePostToCloud]);

  // 5. DELETE LOGIC
  const deletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createClerkSupabaseClient(token || "");
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      
      if (!error) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setBusinessData(prev => prev ? { ...prev, history: prev.history.filter(h => h.id !== postId) } : null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (!isLoaded) return <div className="p-20 text-center">Loading Studio...</div>;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Content Studio</h1>
            <p className="text-slate-500">
              Managing drafts for <span className="text-cyan-800 font-semibold">{businessData?.business_name || "Your Business"}</span>
            </p>
          </div>
          {businessData?.category && (
            <div className="bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-full">
              <p className="text-xs font-bold text-cyan-800 uppercase tracking-widest">{businessData.category}</p>
            </div>
          )}
        </header>

        <div className="flex gap-6 mb-8 border-b border-slate-200">
          <button onClick={() => setActiveTab("generate")} className={`pb-3 px-2 text-sm font-semibold transition-all ${activeTab === 'generate' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-slate-400'}`}>Write New Content</button>
          <button onClick={() => setActiveTab("saved")} className={`pb-3 px-2 text-sm font-semibold transition-all ${activeTab === 'saved' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-slate-400'}`}>Saved Library</button>
        </div>

        <div className="space-y-8">
          {activeTab === "generate" ? (
            <section className="bento-card border-cyan-100 bg-white shadow-sm p-6 rounded-2xl">
              {businessData ? (
                <GenerateDashboard onGenerateSuccess={savePostToCloud} />
              ) : (
                <div className="p-10 text-center border-2 border-dashed rounded-xl">
                  <p className="text-slate-500">Please complete your Profile to start generating.</p>
                </div> 
              )}
              {loading && <p className="text-sm text-cyan-600 mt-2 animate-pulse">Syncing...</p>}
            </section>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-cyan-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] text-slate-400 font-mono">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
                      </p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(post.content);
                          alert("Copied!");
                        }}
                        className="text-[10px] font-bold uppercase bg-cyan-50 text-cyan-700 px-2 py-1 rounded"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed mb-4">
                      {post.content}
                    </p>
                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                      <button onClick={() => deletePost(post.id)} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600">Delete</button>
                      <span className="text-[9px] text-slate-300 font-mono">{post.content.length} chars</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No saved drafts yet.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}