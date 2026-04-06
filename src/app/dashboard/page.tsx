"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GenerateDashboard } from "@/components/GenerateDashboard";
import { createClerksupabase } from '@/lib/supabase';
import { useRouter } from "next/navigation";
import PostActions from "@/components/PostActions";

interface Post { id: string; content: string; created_at: string; business_id: string; }
interface BusinessData { business_name: string; location: string; category: string; niche: string; voice: string; credits: number; history: Post[]; }

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [supabaseToken, setsupabaseToken] = useState<string | null>(null);

  // 1. Get Token
  const supabase = useMemo(() => {
    return createClerksupabase(() => getToken({ template: 'supabase' }));
  }, [getToken]);

  // 3. Load Data
  const loadBusinessData = useCallback(async () => {
    if (!user?.id || !supabase) return;
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('posts').select('*').eq('business_id', user.id).order('created_at', { ascending: false })
      ]);

      if (!profileRes.data && !profileRes.error) {
        router.push('/profile');
        return; 
      }

      if (profileRes.data) {
        const formattedData: BusinessData = {
          business_name: profileRes.data.business_name,
          location: profileRes.data.location,
          category: profileRes.data.category,
          voice: profileRes.data.voice,
          niche: profileRes.data.niche,
          credits: profileRes.data.credits || 0,
          history: postsRes.data || []
        };
        setBusinessData(formattedData);
        setPosts(postsRes.data || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user?.id, supabase, router]);

  // 4. Load Trigger
  useEffect(() => {
    if (isLoaded && user && supabase) { loadBusinessData(); }
  }, [isLoaded, user, supabase, loadBusinessData]);

  // 5. Actions
  const sharePost = async (content: string) => {
    if (navigator?.share) {
      await navigator.share({ title: 'Mimico Studio', text: content }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(content);
      alert("Copied!");
    }
  };

  const savePostToCloud = useCallback(async (newContent: string) => {
    if (!user?.id || !businessData || !supabase) return;
    if (businessData.credits <= 0) return alert("No credits!");
    
    setLoading(true);
    const { error } = await supabase.from("posts").insert([{ content: newContent, business_id: user.id }]);
    if (!error) {
      await supabase.from('profiles').update({ credits: businessData.credits - 1 }).eq('id', user.id);
      await loadBusinessData();
    }
    setLoading(false);
  }, [user?.id, loadBusinessData, businessData, supabase]);

  const deletePost = async (postId: string) => {
    if (!window.confirm("Delete?") || !supabase) return;
    await supabase.from('posts').delete().eq('id', postId);
    loadBusinessData();
  };

  // --- RENDERING ---

  // Handle the Loading State
  if (!isLoaded || !user || !supabase) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>
        <p className="mt-4 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Mimico Studio Securing Session...</p>
      </div>
    );
  }

  // Handle the Main UI
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
            <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-fit">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-xs font-medium text-slate-600">
                <span className="font-bold text-slate-900">{businessData?.credits ?? 0}</span> Credits Remaining
              </p>
            </div>
          </div>
        </header>

        <div className="flex gap-6 mb-8 border-b border-slate-200">
          <button onClick={() => setActiveTab("generate")} className={`pb-3 px-2 text-sm font-semibold transition-all ${activeTab === 'generate' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-slate-400'}`}>Write New Content</button>
          <button onClick={() => setActiveTab("saved")} className={`pb-3 px-2 text-sm font-semibold transition-all ${activeTab === 'saved' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-slate-400'}`}>Saved Library</button>
        </div>

        <div className="space-y-8">
          {activeTab === "generate" ? (
            <section className="bento-card border-cyan-100 bg-white shadow-sm p-6 rounded-2xl">
              {businessData ? (
                <GenerateDashboard 
                  onGenerateSuccess={savePostToCloud}
                  onShare={sharePost}
                  canGenerate={(businessData?.credits ?? 0) > 0}
                  onDelete={() => {}}
                />
              ) : (
                <div className="p-10 text-center border-2 border-dashed rounded-xl">
                  <p className="text-slate-500">Loading your Mimico profile...</p>
                </div> 
              )}
              {loading && <p className="text-xs text-cyan-600 animate-pulse mt-2">Updating...</p>}
            </section>
          ) : (
             <div className="grid gap-4 sm:grid-cols-2">
                {posts.length > 0 ? posts.map(post => (
                  <div key={post.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    
                    <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        {new Date(post.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12:true
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <PostActions 
                    content={post.content} 
                    onDelete={() => deletePost(post.id)} 
                    showCopy={true} // This enables that green "Copied!" button logic
                  />
                  </div>
                )) : (
                  <p className="text-slate-400 italic">No saved drafts yet.</p>
                )}
             </div>
          )}
        </div>
      </main>
    </>
  );
}