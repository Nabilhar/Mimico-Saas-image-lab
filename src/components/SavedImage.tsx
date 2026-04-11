"use client";

import { useState } from "react";

export const SavedImage = ({ url }: { url: string }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden">
      {/* 1. The Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
           <div className="flex flex-col items-center gap-2">
             <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
             <span className="text-[10px] text-slate-400 font-medium">Loading scene...</span>
           </div>
        </div>
      )}

      {/* 2. The Actual Image */}
      <img
        src={url}
        alt="Saved local scene"
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setLoading(false)}
        onError={(e) => {
          setLoading(false);
          console.error("Image load error:", url);
          // Fallback to a clean placeholder if the link is broken/old
          e.currentTarget.src = "https://placehold.co/1024x1024/e2e8f0/64748b?text=Image+Unavailable";
        }}
      />
    </div>
  );
};