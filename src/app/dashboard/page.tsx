"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GenerateDashboard } from "@/components/GenerateDashboard";
import { createClerksupabase } from '@/lib/supabase';
import { useRouter } from "next/navigation";
import PostActions from "@/components/PostActions";
import { SavedImage } from "@/components/SavedImage";

  let supabaseClient: any;

export interface Post { id: string; content: string; created_at: string; business_id: string; image_url?: string; }
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
    // We pass a stable reference to getToken
    return createClerksupabase(() => getToken({ template: 'supabase' }));
  }, []); // Empty dependency array!

  // 3. Load Data
  const loadBusinessData = useCallback(async () => {
    if (!user?.id || !supabase) return;
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('community_posts')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false })
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


  const savePostToCloud = useCallback(async (newContent: string, imageUrl?: string) => {
    if (!user?.id || !businessData || !supabase) return;
  
    const cost = 1 + (imageUrl ? 2 : 0);
  
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('save_post_and_deduct', {
          p_user_id: user.id,
          p_content: newContent,
          p_image_url: imageUrl || '',
          p_amount: cost
        });
  
      if (rpcError || !rpcResult[0]?.success) {
        alert("Insufficient credits! Email Nabil for a refill.");
        return undefined;
      }
  
      // Update local state immediately for a fast UI
      setPosts(prev => [{
        id: rpcResult[0].new_post_id,
        content: newContent,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        business_id: user.id
      }, ...prev]);
      
      await loadBusinessData(); // Sync the credit count
      return rpcResult[0].new_post_id;
  
    } catch (err: any) {
      console.error("Deduction error:", err.message);
      return undefined;
    }
  }, [user?.id, loadBusinessData, businessData, supabase]);

  const deletePost = async (postId: string) => {
    if (!window.confirm("Delete?") || !supabase) return;
    await supabase.from('community_posts').delete().eq('id', postId);
    loadBusinessData();
  };

  // --- RENDERING ---

  // Handle the Loading State
  if (!isLoaded || !user || !supabase) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>
        <p className="mt-4 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Shoreline Studio Securing Session...</p>
      </div>
    );
  }

  // Handle the Main UI
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-0 sm:px-6 py-8">
        <header className="mb-8 flex justify-between items-center px-4 sm:px-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Content Studio</h1>
            <p className="text-slate-500">
              Managing drafts for <span className="text-cyan-800 font-semibold">{businessData?.business_name || "Your Business"}</span>
            </p>
            <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-fit">
              
              <div 
                className={`w-2 h-2 rounded-full animate-pulse transition-colors duration-500 ${
                  (businessData?.credits ?? 0) < 3 
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                    : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                }`}
              ></div>
             
              <p className="text-xs font-medium text-slate-600">
                <span className="font-bold text-slate-900">{businessData?.credits ?? 0}
                </span> Credits Remaining
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
            <section className="bg-transparent sm:bg-white p-0 sm:p-6 sm:rounded-2xl sm:border sm:border-cyan-100 sm:shadow-sm">
              {businessData ? (
                <GenerateDashboard 
                  supabase={supabase}
                  onGenerateSuccess={(content, url) => savePostToCloud(content, url)}
                  canGenerate={(businessData?.credits ?? 0) > 0}
                  userCredits={businessData?.credits ?? 0}
                  onDelete={() => {}}
                  history={posts} 
                  onImageUpdated={loadBusinessData}
                />
              ) : (
                <div className="p-10 text-center border-2 border-dashed rounded-xl mx-4 sm:mx-0">
                  <p className="text-slate-500">Loading your Shoreline profile...</p>
                </div> 
              )}
              {loading && <p className="text-xs text-cyan-600 animate-pulse mt-2">Updating...</p>}
            </section>

      // ─────────────────────────────────────────────────────────────────
      // REPLACE the saved library section in your DashboardPage.tsx
      // ─────────────────────────────────────────────────────────────────

      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-6">
          {posts.length > 0 ? (
            posts.map(post => (
              <div
                key={post.id}
                className="flex flex-col bg-white sm:rounded-2xl border-y border-x-0 sm:border-x border-slate-100 shadow-sm overflow-hidden"
              >
                {/* ── FACEBOOK-STYLE HEADER ───────────────── */}
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar circle */}
                  <div className="w-10 h-10 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {businessData?.business_name?.[0]?.toUpperCase() || 'Q'}
                  </div>
                
                  {/* Container for Name and Location/Date row */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-slate-900 text-sm leading-tight truncate">
                      {businessData?.business_name || 'Your Business'}
                    </span>

                    {/* Row for Location and Date */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      {businessData?.location && (
                        <span className="text-[10px] text-slate-500 font-medium truncate">
                          {businessData.location.split(',')[0]}
                        </span>
                      )}
                    
                      <span className="shrink-0 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded uppercase tracking-widest">
                        {post?.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        }) : 'Just now'}
                      </span>
                    </div>
                  </div> {/* <── THIS WAS THE MISSING CLOSING TAG */}
                </div>
            
                {/* ── CAPTION (above image, like Facebook) ── */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {post.content}
                  </p>
                  {/* Show full caption hint if truncated */}
                  {post.content.length > 220 && (
                    <button
                      className="text-xs text-cyan-600 mt-1 hover:underline"
                      onClick={(e) => {
                        const p = (e.currentTarget.previousElementSibling as HTMLElement);
                        if (p) {
                          p.classList.toggle('line-clamp-4');
                          e.currentTarget.textContent =
                            p.classList.contains('line-clamp-4') ? '...see more' : 'see less';
                        }
                      }}
                    >
                      ...see more
                    </button>
                  )}
                </div>

                {/* ── IMAGE (full-bleed, 1:1 square) ────────── */}
                {post.image_url ? (
                  <div className="w-full aspect-square bg-slate-100 border-y border-slate-100 shrink-0">
                    <SavedImage url={post.image_url} />
                  </div>
                ) : (
                  /* No image — subtle placeholder so cards stay consistent */
                  <div className="mx-4 mb-3 h-12 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Text only</span>
                  </div>
                )}

                {/* ── ACTIONS FOOTER ──────────────────────── */}
                <div className="px-4 pb-4">
                  <PostActions
                    content={post.content}
                    imageUrl={post.image_url}
                    onDelete={() => deletePost(post.id)}
                    showCopy={true}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full mx-4 py-16 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 italic text-sm">No saved drafts yet.</p>
              <p className="text-slate-300 text-xs mt-1">Generate your first post to see it here.</p>
            </div>
          )}
        </div>
            )}
        </div>
      </main>
    </>
  );
}