"use client"; // Required because we use useState/useEffect

import { useState } from "react";

  export const SavedImage = ({ url }: { url: string }) => {
    const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0);
    const validUrl = url?.startsWith('https//') 
    ? url.replace('https//', 'https://') 
    : url;

    return (
      <div className="relative w-full h-full bg-slate-100">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 animate-pulse">
            Waking up AI image...
          </div>
        )}
        <img
          key={`${validUrl}-${retry}`}
          src={validUrl}
          alt="Saved local scene"
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-500 ${ 
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() =>  {
            console.log("✅ Image Loaded:", validUrl);
            setLoading(false);
          }}
          onError={() => {
            console.error("❌ Image Failed:", validUrl);
            if (retry < 5) {
              setTimeout(() => setRetry((prev) => prev + 1), 3000);
            } else {
              setLoading(false); // Stop the animation so it doesn't spin forever
            }
          }}
        />
      </div>
    );
  };