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
  credits: number; //
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
          credits: profileRes.data.credits || 0,
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
    if (!user?.id || !businessData) return;
  
    // 1. SAFETY CHECK: Do they have credits?
    if (businessData.credits <= 0) {
      alert("🚫 Out of credits! Please upgrade your plan to generate more posts.");
      return;
    }
    
    const tempId = 'temp-' + Date.now();
    const temporaryPost: Post = {
      id: tempId,
      content: newContent,
      created_at: new Date().toISOString(),
      business_id: user.id
    };
    setPosts(prev => [temporaryPost, ...prev]);
    // setActiveTab("saved"); 

    setLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createClerkSupabaseClient(token || "");

      const { error } = await supabase
        .from("posts")
        .insert([{ content: newContent, business_id: user.id,created_at: new Date().toISOString() }]);

      if (error) {
        setPosts(prev => prev.filter(p => p.id !== tempId));
        alert("❌ Failed to save post. Your credits were NOT charged..");
      return;
      }

      const newCreditCount = businessData.credits - 1;
    setBusinessData(prev => prev ? { ...prev, credits: newCreditCount } : null);

      const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: newCreditCount })
      .eq('id', user.id);

    if (creditError) {
      console.error("Database failed to sync credits:", creditError);
      // Even if this fails, the post is saved. We can refresh to see if it eventually syncs.
    }
    // 4. REFRESH UI: Update the post list and the credit counter
    await loadBusinessData();

    } catch (err) {
      console.error("Save crash:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, getToken, loadBusinessData, businessData]);

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

  const deleteAllPosts = async () => {
    // 1. Safety Confirmation
    const confirmClear = window.confirm(
      "Are you sure you want to delete ALL saved posts? This cannot be undone."
    );
    if (!confirmClear) return;
  
    setLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createClerkSupabaseClient(token || "");
  
      // 2. Delete all posts where business_id matches the user
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('business_id', user?.id);
  
      if (error) throw error;
  
      // 3. Update Local State (Clear the UI immediately)
      setPosts([]);
      setBusinessData(prev => prev ? { ...prev, history: [] } : null);
      
      alert("Library cleared successfully.");
    } catch (err) {
      console.error("Delete All Error:", err);
      alert("Failed to delete posts. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

    // 7. SHARE LOGIC
      const sharePost = async (content: string) => {
        if (navigator?.share) {
          try {
            await navigator.share({
              title: 'Content from Orali',
              text: content,
            });
          } catch (err) {
            console.log('Share dismissed');
          }
        } else {
          await navigator.clipboard.writeText(content);
          alert("Share menu not supported on this device. Content copied to clipboard!");
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
                {/* CREDIT BADGE */}
          <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-xs font-medium text-slate-600">
            <span className="font-bold text-slate-900">{businessData?.credits ?? 0}</span> Credits Remaining
          </p>
          </div>
        
          </div>
          {businessData?.niche && (
            <div className="bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-full">
              <p className="text-xs font-bold text-cyan-800 uppercase tracking-widest">{businessData.niche}</p>
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
                <GenerateDashboard onGenerateSuccess={savePostToCloud}
                onShare={sharePost}
                 />
              ) : (

                <div className="p-10 text-center border-2 border-dashed rounded-xl">
                  <p className="text-slate-500">Please complete your Profile to start generating.</p>
                </div> 
              )}
              {loading && <p className="text-sm text-cyan-600 mt-2 animate-pulse">Syncing...</p>}
            </section>
          ) : (

            <div className="space-y-6"> 
            
            {/* 1. THE HEADER WITH THE CLEAR BUTTON */}
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Saved Library</h2>
                <p className="text-[10px] text-slate-400">{posts.length} posts saved</p>
              </div>
        
              {posts.length > 0 && (
                <button 
                  onClick={deleteAllPosts}
                  className="text-[10px] font-bold text-red-400 hover:text-white hover:bg-red-500 border border-red-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  CLEAR ALL
                </button>
              )}
            </div>
            

            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-cyan-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] text-slate-400 font-mono">
                      {post.created_at 
                          ? new Date(post.created_at).toLocaleString([], { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) 
                          : 'Just now'}
                      </p>
                      <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(post.content);
                          alert("Copied!");
                        }}
                        className="text-[10px] font-bold uppercase bg-cyan-50 text-cyan-700 px-2 py-1 rounded hover:bg-cyan-100 transition-colors"
                      >
                        Copy
                      </button>

                      <button 
                        onClick={() => sharePost(post.content)}
                        className="text-[10px] font-bold uppercase bg-cyan-50 text-cyan-700 px-2 py-1 rounded hover:bg-cyan-100 transition-colors"
                      >
                        Share
                      </button>
                      </div>
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
          </div>
          )}
        </div>
      </main>
    </>
  );
}